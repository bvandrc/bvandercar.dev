/**
 * Fetches the weekly download history of each npm and PyPI package the profile
 * content names, for the chart in a project's counts tooltip.
 *
 * Writes src/generated/package-downloads.ts, gitignored. Reads the package
 * names from the content `pnpm fetch:profile` copied, so run that first. npm's
 * history comes from its downloads API. PyPI's comes from Google BigQuery's
 * public PyPI dataset, and only when `GOOGLE_APPLICATION_CREDENTIALS` points at
 * Google Cloud credentials; without them, PyPI packages are skipped. A package that can't be
 * read is left out with a warning, and its card shows no chart, rather than
 * failing the build over a stats outage.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { BigQuery } from '@google-cloud/bigquery'
import { chunk, sumBy } from 'es-toolkit'

const PROJECTS_FILE = 'src/generated/profile/content/projects.ts'
const OUT_FILE = 'src/generated/package-downloads.ts'

/** Days per npm query, inside the 18 months the API answers at once. */
const NPM_WINDOW_DAYS = 365
const DAY_MS = 24 * 60 * 60 * 1000

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

type DailyDownloads = { day: string; downloads: number }

const isoDate = (time: number) => new Date(time).toISOString().slice(0, 10)

/** Every ISO date from `first` through `last`. */
const listDays = (first: string, last: string) => {
  const days: string[] = []
  for (let time = Date.parse(first); time <= Date.parse(last); time += DAY_MS) {
    days.push(isoDate(time))
  }
  return days
}

/** A JSON response from `url`, throwing on any non-2xx status. */
const fetchJson = async <T>(url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`${res.status} for ${url}`)
  }
  return (await res.json()) as T
}

/** A package's downloads for each day from its first publish through the last day npm has counted. */
const fetchNpmDailyDownloads = async (pkg: string) => {
  // A scoped name's slash would otherwise read as a path segment.
  const name = pkg.replace('/', '%2F')
  const [{ time }, latest] = await Promise.all([
    fetchJson<{ time: { created: string } }>(
      `https://registry.npmjs.org/${name}`
    ),
    // The range API answers 0 for a day it hasn't counted yet, which would
    // read as a drop, so the range stops at the last day it has.
    fetchJson<{ end: string }>(
      `https://api.npmjs.org/downloads/point/last-day/${name}`
    ),
  ])
  const lastDay = Date.parse(latest.end)
  const days: DailyDownloads[] = []
  // The API caps each query's range, so an older package takes several.
  for (
    // From the start of the publish day, which a range has to begin on.
    let start = Date.parse(time.created.slice(0, 10));
    start <= lastDay;
    start += NPM_WINDOW_DAYS * DAY_MS
  ) {
    const end = Math.min(start + (NPM_WINDOW_DAYS - 1) * DAY_MS, lastDay)
    const { downloads } = await fetchJson<{ downloads: DailyDownloads[] }>(
      `https://api.npmjs.org/downloads/range/${isoDate(start)}:${isoDate(end)}/${name}`
    )
    days.push(...downloads)
  }
  return days
}

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

/**
 * Each PyPI package's downloads for each day from its first upload through
 * two days ago, in one BigQuery query.
 *
 * Logs what the query billed, so its cost shows in the build log.
 */
const fetchPypiDailyDownloads = async (packages: string[]) => {
  const firstDays = await Promise.all(packages.map(fetchPypiFirstDay))
  // Two days back, like npm's latest, so a day still being loaded into the
  // dataset never reads as a drop.
  const lastDay = isoDate(Date.now() - 2 * DAY_MS)
  // The credentials name the project the query is billed to.
  const [job] = await new BigQuery().createQueryJob({
    // The table is partitioned by `timestamp` and clustered by project, so
    // bounding both keeps the scan to these packages' days.
    query: `
      SELECT file.project AS project, FORMAT_DATE('%F', DATE(timestamp)) AS day, COUNT(*) AS downloads
      FROM \`bigquery-public-data.pypi.file_downloads\`
      WHERE file.project IN UNNEST(@packages)
        AND timestamp >= TIMESTAMP(@firstDay)
        AND timestamp < TIMESTAMP_ADD(TIMESTAMP(@lastDay), INTERVAL 1 DAY)
      GROUP BY project, day`,
    params: { packages, firstDay: firstDays.toSorted()[0], lastDay },
    maximumBytesBilled: MAX_BYTES_BILLED,
  })
  const [rows] = await job.getQueryResults()
  const [metadata] = await job.getMetadata()
  const billed = Number(metadata.statistics?.query?.totalBytesBilled ?? 0)
  console.log(
    `PyPI downloads: BigQuery billed ${(billed / 1000 ** 3).toFixed(2)} GB`
  )
  const counts = new Map(
    (rows as { project: string; day: string; downloads: number }[]).map(
      ({ project, day, downloads }) => [`${project} ${day}`, downloads]
    )
  )
  // A day without downloads has no row, so each day is filled in from the first.
  return packages.map((pkg, index) =>
    listDays(firstDays[index], lastDay).map(
      (day): DailyDownloads => ({
        day,
        downloads: counts.get(`${pkg} ${day}`) ?? 0,
      })
    )
  )
}

/**
 * Daily downloads summed into weeks that end on the last day.
 *
 * Counting back from the last day keeps the latest week whole, so it never
 * reads as a drop; the week of the first publish is the one left short.
 */
const sumWeeks = (days: DailyDownloads[]) =>
  // Chunked from the end, which leaves any short week first.
  chunk(days.toReversed(), 7)
    .map((week) => sumBy(week, ({ downloads }) => downloads))
    .toReversed()

/** A line of the generated file for one package, or none for one with no days. */
const formatEntry = (pkg: string, days: DailyDownloads[]) => {
  const firstDay = days.at(0)?.day
  const lastDay = days.at(-1)?.day
  return firstDay && lastDay
    ? [
        `    '${pkg}': { firstDay: '${firstDay}', lastDay: '${lastDay}', weekly: [${sumWeeks(days).join(', ')}] },`,
      ]
    : []
}

const warnSkipped = (what: string, error: unknown) =>
  console.warn(
    `::warning::${what} could not be read, so no chart shows for it: ${error instanceof Error ? error.message : error}`
  )

const projects = await readFile(PROJECTS_FILE, 'utf8')
/** The package names the projects give under `field`, sorted. */
const getPackages = (field: 'npmPackage' | 'pypiPackage') =>
  [...projects.matchAll(new RegExp(`${field}:\\s*'([^']+)'`, 'g'))]
    .map(([, pkg]) => pkg)
    .sort()

const npmPackages = getPackages('npmPackage')
const npmEntries: string[] = []
for (const pkg of npmPackages) {
  try {
    npmEntries.push(...formatEntry(pkg, await fetchNpmDailyDownloads(pkg)))
  } catch (error) {
    warnSkipped(`npm downloads for ${pkg}`, error)
  }
}

const pypiPackages = getPackages('pypiPackage')
const pypiEntries: string[] = []
if (pypiPackages.length > 0 && !hasGoogleCredentials) {
  console.warn(
    '::notice::GOOGLE_APPLICATION_CREDENTIALS is not set, so PyPI packages show no chart'
  )
} else if (pypiPackages.length > 0) {
  try {
    const histories = await fetchPypiDailyDownloads(pypiPackages)
    pypiPackages.forEach((pkg, index) => {
      pypiEntries.push(...formatEntry(pkg, histories[index]))
    })
  } catch (error) {
    warnSkipped('PyPI downloads', error)
  }
}

await mkdir('src/generated', { recursive: true })
await writeFile(
  OUT_FILE,
  `// GENERATED FILE — do not edit directly. Run \`pnpm fetch:downloads\`.

/** A package registry whose downloads are charted. */
export type Registry = 'npm' | 'pypi'

export type WeeklyDownloads = {
  /** ISO date of the first day counted, the package's first publish */
  firstDay: string
  /** ISO date of the last day counted, the end of the last week */
  lastDay: string
  /** Downloads in each 7-day week ending on \`lastDay\`, oldest first; the first can be shorter */
  weekly: number[]
}

/** Each package's weekly downloads since its first publish, by registry, then package name. */
export const PACKAGE_DOWNLOADS: Record<
  Registry,
  Record<string, WeeklyDownloads | undefined>
> = {
  npm: {
${npmEntries.join('\n')}
  },
  pypi: {
${pypiEntries.join('\n')}
  },
}
`
)
console.log(
  `package downloads: weekly history for ${npmEntries.length} of ${npmPackages.length} npm and ${pypiEntries.length} of ${pypiPackages.length} PyPI packages`
)
