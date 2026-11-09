/**
 * PyPI's side of `pnpm fetch:downloads`: a package's first upload day, from
 * PyPI's JSON API, which needs no credentials, and its downloads per day,
 * from Google BigQuery's public PyPI dataset, which does.
 *
 * Its daily counts are kept in PYPI_CACHE_FILE between runs, so a run queries
 * only the days since the last.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { BigQuery } from '@google-cloud/bigquery'

import { DAY_MS } from '../shared/constants.ts'
import { earlierDay, isoDate, laterDay, listDays } from '../shared/dates.ts'
import { fetchJson } from '../shared/http.ts'
import { reportSkipped } from '../shared/skipped.ts'
import type { DailyDownloads, RegistryHistory } from './common.ts'

// Gitignored; CI's deploy and preview builds carry it between runs in the
// Actions cache.
const CACHE_DIR = '.cache'
const PYPI_CACHE_FILE = `${CACHE_DIR}/pypi-downloads.json`
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

/** The ISO date a PyPI package's first file was uploaded. */
const fetchPypiFirstDay = async (pkg: string) => {
  const { releases } = await fetchJson<{
    releases: Record<string, { upload_time_iso_8601: string }[]>
  }>(`https://pypi.org/pypi/${pkg}/json`)
  return Object.values(releases)
    .flat()
    .map(({ upload_time_iso_8601 }) => upload_time_iso_8601.slice(0, 10))
    .sort()[0]
}

/** The PyPI counts a run before this one kept, or none. */
const readPypiCache = async (): Promise<DailyCache> => {
  try {
    return JSON.parse(await readFile(PYPI_CACHE_FILE, 'utf8')) as DailyCache
  } catch {
    return {}
  }
}

/**
 * Each package's downloads on each day from `from` through `to`, by
 * `"<package> <day>"`, in one BigQuery query.
 *
 * Logs what the query billed, so its cost shows in the build log.
 */
const queryPypiDownloads = async (
  packages: string[],
  from: string,
  to: string
) => {
  // The credentials name the project the query is billed to.
  const [job] = await new BigQuery().createQueryJob({
    // The table is partitioned by `timestamp` and clustered by project, so
    // bounding both keeps the scan to these packages' days.
    query: `
      SELECT file.project AS project, FORMAT_DATE('%F', DATE(timestamp)) AS day, COUNT(*) AS downloads
      FROM \`bigquery-public-data.pypi.file_downloads\`
      WHERE file.project IN UNNEST(@packages)
        AND timestamp >= TIMESTAMP(@from)
        AND timestamp < TIMESTAMP_ADD(TIMESTAMP(@to), INTERVAL 1 DAY)
      GROUP BY project, day`,
    params: { packages, from, to },
    maximumBytesBilled: MAX_BYTES_BILLED,
  })
  const [rows] = await job.getQueryResults()
  const [metadata] = await job.getMetadata()
  const billed = Number(metadata.statistics?.query?.totalBytesBilled ?? 0)
  console.log(
    `PyPI downloads: BigQuery billed ${(billed / 1000 ** 3).toFixed(2)} GB for ${from} to ${to}`
  )
  return new Map(
    (rows as { project: string; day: string; downloads: number }[]).map(
      ({ project, day, downloads }) => [`${project} ${day}`, downloads]
    )
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

/** Keeps `cache` for the next run, even after a query that failed partway, so it picks up where this one left off. */
const writePypiCache = async (cache: DailyCache) => {
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(PYPI_CACHE_FILE, JSON.stringify(cache))
}

/**
 * Each of the PyPI `packages`' downloads per day since its first upload,
 * leaving out, and reporting, any that can't be read.
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
  // Checked before the first days are read, which would go unused without it.
  if (!hasGoogleCredentials) {
    reportSkipped(
      "every PyPI package's downloads",
      'GOOGLE_APPLICATION_CREDENTIALS is not set'
    )
    return history
  }
  const firstDays: { pkg: string; firstDay: string }[] = []
  const results = await Promise.allSettled(packages.map(fetchPypiFirstDay))
  results.forEach((result, index) => {
    const pkg = packages[index]
    if (result.status === 'rejected') {
      reportSkipped(`PyPI downloads for ${pkg}`, result.reason)
    } else {
      firstDays.push({ pkg, firstDay: result.value })
    }
  })
  if (firstDays.length === 0) {
    return history
  }
  try {
    const cache = await readPypiCache()
    try {
      const days = await fetchPypiDailyDownloads(firstDays, cache)
      firstDays.forEach(({ pkg }, index) => {
        history.push({ pkg, days: days[index] })
      })
    } finally {
      await writePypiCache(cache)
    }
  } catch (error) {
    reportSkipped('PyPI downloads', error)
  }
  return history
}
