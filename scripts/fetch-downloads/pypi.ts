/**
 * PyPI's side of `pnpm fetch:downloads`: a package's first upload day, and its
 * downloads per day, from Google BigQuery's public PyPI dataset, and its
 * releases, from PyPI's JSON API.
 *
 * Its first days and daily counts are published with the site, which the next
 * run reads them back from, so a run queries only the days since the last
 * deploy.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { BigQuery } from '@google-cloud/bigquery'

import {
  DAY_MS,
  earlierDay,
  isoDate,
  laterDay,
  listDays,
} from '../../shared/dates.ts'
import { SITE_URL } from '../../site.config.ts'
import { getErrorMessage } from '../shared/errors.ts'
import { fetchJson } from '../shared/http.ts'
import { reportSkipped } from '../shared/skipped.ts'
import {
  byDay,
  type DailyDownloads,
  type RegistryHistory,
  type Release,
} from './common.ts'

// Copied into the built site, gitignored. The site never loads them; only the
// next build does, from the live site, where they last as long as the deploy,
// unlike an Actions cache, which GitHub drops after a week unused.
const PUBLISHED_DIR = 'public/data'
const DAILY_FILE = 'pypi-downloads.json'
const FIRST_DAYS_FILE = 'pypi-first-days.json'
// The latest cached days a run queries again, since the dataset can still be
// filling them in.
const PYPI_REFRESH_DAYS = 3
// Days per PyPI query, each billing well under the cap, where a whole history
// in one query bills over it.
const PYPI_WINDOW_DAYS = 180

/**
 * The most a PyPI query may bill: 50 GB.
 *
 * Over it, BigQuery stops the query without charging for it. At that cap, 20
 * builds a month, across deploys and PR previews, stay inside BigQuery's free
 * terabyte a month.
 */
const MAX_BYTES_BILLED = String(50 * 1000 ** 3)

// Set by CI's Google Cloud auth step, or by hand locally. Checked up front
// because looking for credentials elsewhere can wait on a metadata server.
const hasGoogleCredentials = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)

/** Each package's downloads, by package, then ISO date. */
type DailyCache = Record<string, Record<string, number> | undefined>

/** Each package's first upload day, by package. */
type FirstDaysCache = Record<string, string | undefined>

/** What the live site published as `file`, or nothing where it has none or can't be reached. */
const readPublished = async <T extends object>(file: string): Promise<T> => {
  try {
    return await fetchJson<T>(`${SITE_URL}data/${file}`)
  } catch (error) {
    console.log(
      `PyPI downloads: starting without the live site's ${file}: ${getErrorMessage(error)}`
    )
    return {} as T
  }
}

/**
 * A PyPI package's releases, oldest first, leaving out pre-releases and
 * deleted ones, which its JSON API no longer lists.
 */
const fetchPypiReleases = async (pkg: string) => {
  const { releases } = await fetchJson<{
    releases: Record<string, { upload_time_iso_8601: string }[]>
  }>(`https://pypi.org/pypi/${pkg}/json`)
  return (
    Object.entries(releases)
      // A release with no files was deleted. A pre-release ends in a, b, rc,
      // or dev and a number, like 2.0b1.
      .filter(
        ([version, files]) =>
          files.length > 0 && !/(a|b|rc|dev)\d*$/i.test(version)
      )
      .map(
        ([version, files]): Release => ({
          version,
          // The day its first file was uploaded.
          day: files
            .map(({ upload_time_iso_8601 }) =>
              upload_time_iso_8601.slice(0, 10)
            )
            .sort()[0],
        })
      )
      .sort(byDay)
  )
}

/**
 * The rows `query` returns, with `params`, from BigQuery.
 *
 * Logs what it billed, labelled `label`, so its cost shows in the build log.
 */
const runQuery = async <T>(
  query: string,
  params: Record<string, unknown>,
  label: string
) => {
  // The credentials name the project the query is billed to.
  const [job] = await new BigQuery().createQueryJob({
    query,
    params,
    maximumBytesBilled: MAX_BYTES_BILLED,
  })
  const [rows] = await job.getQueryResults()
  const [metadata] = await job.getMetadata()
  const billed = Number(metadata.statistics?.query?.totalBytesBilled ?? 0)
  console.log(
    `PyPI downloads: BigQuery billed ${(billed / 1000 ** 3).toFixed(2)} GB for ${label}`
  )
  return rows as T[]
}

/**
 * Each package's first upload day, by package, adding to `cache` any it
 * lacks. One with no uploads is left out.
 *
 * Read from BigQuery's upload records rather than PyPI's JSON API, which
 * drops a deleted release, so a package whose first releases were deleted
 * still counts the downloads they had.
 */
const getFirstDays = async (packages: string[], cache: FirstDaysCache) => {
  const missing = packages.filter((pkg) => cache[pkg] === undefined)
  if (missing.length > 0) {
    const rows = await runQuery<{ project: string; firstDay: string }>(
      // A name is uploaded as written, like serato_tools, where downloads
      // give it normalized, like serato-tools, so it's normalized to match.
      `
      SELECT LOWER(REGEXP_REPLACE(name, r'[-_.]+', '-')) AS project, FORMAT_DATE('%F', DATE(MIN(upload_time))) AS firstDay
      FROM \`bigquery-public-data.pypi.distribution_metadata\`
      WHERE LOWER(REGEXP_REPLACE(name, r'[-_.]+', '-')) IN UNNEST(@packages)
      GROUP BY project`,
      { packages: missing },
      'first upload days'
    )
    for (const { project, firstDay } of rows) {
      cache[project] = firstDay
    }
  }
  return packages.flatMap((pkg) => {
    const firstDay = cache[pkg]
    return firstDay === undefined ? [] : [{ pkg, firstDay }]
  })
}

/**
 * Each package's downloads on each day from `from` through `to`, by
 * `"<package> <day>"`, in one BigQuery query.
 */
const queryPypiDownloads = async (
  packages: string[],
  from: string,
  to: string
) => {
  const rows = await runQuery<{
    project: string
    day: string
    downloads: number
  }>(
    // The table is partitioned by `timestamp` and clustered by project, so
    // bounding both keeps the scan to these packages' days.
    `
      SELECT file.project AS project, FORMAT_DATE('%F', DATE(timestamp)) AS day, COUNT(*) AS downloads
      FROM \`bigquery-public-data.pypi.file_downloads\`
      WHERE file.project IN UNNEST(@packages)
        AND timestamp >= TIMESTAMP(@from)
        AND timestamp < TIMESTAMP_ADD(TIMESTAMP(@to), INTERVAL 1 DAY)
      GROUP BY project, day`,
    { packages, from, to },
    `${from} to ${to}`
  )
  return new Map(
    rows.map(({ project, day, downloads }) => [`${project} ${day}`, downloads])
  )
}

/**
 * Each PyPI package's downloads for each day from its first upload through
 * two days ago.
 *
 * Only the days `cache` doesn't have yet are queried, plus its latest few,
 * and the counts are added to it as each query returns, so a run that fails
 * partway keeps what it got. A package it lacks back to the first day is
 * queried in full, a window of days at a time.
 */
const fetchPypiDailyDownloads = async (
  packages: { pkg: string; firstDay: string }[],
  cache: DailyCache
) => {
  // Two days back, like npm's latest, so a day still being loaded into the
  // dataset never reads as a drop.
  const lastDay = isoDate(Date.now() - 2 * DAY_MS)
  // The day each package's query starts on: its first, unless cached from it.
  const starts = packages.map(({ pkg, firstDay }) => {
    const cached = cache[pkg]
    const latestCached = Object.keys(cached ?? {})
      .sort()
      .at(-1)
    return cached?.[firstDay] !== undefined && latestCached
      ? isoDate(Date.parse(latestCached) - PYPI_REFRESH_DAYS * DAY_MS)
      : firstDay
  })
  // A whole history in one query bills more than the cap allows, so it's
  // read a window at a time, oldest first.
  for (
    let from = starts.toSorted()[0];
    from <= lastDay;
    from = isoDate(Date.parse(from) + PYPI_WINDOW_DAYS * DAY_MS)
  ) {
    const windowEnd = isoDate(
      Date.parse(from) + (PYPI_WINDOW_DAYS - 1) * DAY_MS
    )
    const to = earlierDay(windowEnd, lastDay)
    const counts = await queryPypiDownloads(
      packages.map(({ pkg }) => pkg),
      from,
      to
    )
    for (const { pkg, firstDay } of packages) {
      const days = cache[pkg] ?? {}
      // A queried day without downloads has no row, so it's set to 0 rather
      // than left at whatever an earlier run counted.
      for (const day of listDays(laterDay(from, firstDay), to)) {
        days[day] = counts.get(`${pkg} ${day}`) ?? 0
      }
      cache[pkg] = days
    }
  }
  return packages.map(({ pkg, firstDay }) =>
    listDays(firstDay, lastDay).map(
      (day): DailyDownloads => ({ day, downloads: cache[pkg]?.[day] ?? 0 })
    )
  )
}

/** Writes `data` as `file`, to publish with the site for the next run, even after a query that failed partway, so it picks up where this one left off. */
const writePublished = async (file: string, data: object) => {
  await mkdir(PUBLISHED_DIR, { recursive: true })
  await writeFile(`${PUBLISHED_DIR}/${file}`, JSON.stringify(data))
}

/**
 * Each of the PyPI `packages`' downloads per day since its first upload, and
 * its releases, leaving out, and reporting, any that can't be read.
 *
 * Without `GOOGLE_APPLICATION_CREDENTIALS`, it reads none.
 */
export const fetchPypiHistory = async (
  packages: string[]
): Promise<RegistryHistory> => {
  const history: RegistryHistory = []
  if (packages.length === 0) {
    return history
  }
  if (!hasGoogleCredentials) {
    reportSkipped(
      "every PyPI package's downloads",
      'GOOGLE_APPLICATION_CREDENTIALS is not set'
    )
    return history
  }
  try {
    const firstDaysCache = await readPublished<FirstDaysCache>(FIRST_DAYS_FILE)
    const cache = await readPublished<DailyCache>(DAILY_FILE)
    try {
      const firstDays = await getFirstDays(packages, firstDaysCache)
      for (const pkg of packages) {
        if (firstDaysCache[pkg] === undefined) {
          reportSkipped(`PyPI downloads for ${pkg}`, 'BigQuery has no uploads')
        }
      }
      const days = await fetchPypiDailyDownloads(firstDays, cache)
      const releases = await Promise.allSettled(
        firstDays.map(({ pkg }) => fetchPypiReleases(pkg))
      )
      firstDays.forEach(({ pkg }, index) => {
        const result = releases[index]
        if (result.status === 'rejected') {
          reportSkipped(`PyPI releases for ${pkg}`, result.reason)
        } else {
          history.push({ pkg, days: days[index], releases: result.value })
        }
      })
    } finally {
      await writePublished(FIRST_DAYS_FILE, firstDaysCache)
      await writePublished(DAILY_FILE, cache)
    }
  } catch (error) {
    reportSkipped('PyPI downloads', error)
  }
  return history
}
