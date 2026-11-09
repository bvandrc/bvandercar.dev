/**
 * Fetches the downloads of each npm and PyPI package the profile content
 * names: in all, which its project's counts' glyph shows, and week by week,
 * with its releases, for the charts in its counts' tooltip.
 *
 * Writes src/generated/package-download-totals.ts and
 * src/generated/package-downloads.ts, gitignored, for the same packages. Reads the
 * package names from the content `pnpm fetch:profile` copied, so run that
 * first. Each registry's fetches live in fetch-downloads/: npm.ts reads npm's
 * APIs, and pypi.ts reads PyPI's, and BigQuery's, only when
 * `GOOGLE_APPLICATION_CREDENTIALS` points at Google Cloud credentials; without
 * them, PyPI packages are skipped. A package that can't be read is left out
 * with a warning, and its glyph keeps the profile's count, rather than failing
 * the build over a stats outage, unless `REQUIRE_FETCHED_DATA=true`, as the
 * deploy sets it. With `REUSE_FETCHED_DATA=true`, it keeps the file where it
 * already exists, as a preview build does with recent data it restored from
 * its cache.
 */

import { chunk, sumBy } from 'es-toolkit'

import { PACKAGE_FIELDS, type Registry } from '../shared/counts.ts'
import type {
  DailyDownloads,
  RegistryHistory,
} from './fetch-downloads/common.ts'
import { fetchNpmHistory } from './fetch-downloads/npm.ts'
import { fetchPypiHistory } from './fetch-downloads/pypi.ts'
import { GENERATED_DIR } from './shared/constants.ts'
import { exitIfReusing, writeGenerated } from './shared/generated.ts'
import {
  findShortfall,
  getPackageRepo,
  getProjectValues,
} from './shared/projects.ts'
import { reportSkipped } from './shared/skipped.ts'

const TOTALS_FILE = `${GENERATED_DIR}/package-download-totals.ts`
const HISTORY_FILE = `${GENERATED_DIR}/package-downloads.ts`

exitIfReusing('package downloads', [TOTALS_FILE, HISTORY_FILE])

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

/**
 * The packages of one registry's history to write, each with its total.
 *
 * Leaves out one with no days counted yet, and reports one whose total is
 * fewer than its profile count, which is older, so the fetch missed some.
 */
const keepCounted = (registry: Registry, history: RegistryHistory) =>
  history
    .filter(({ days }) => days.length > 0)
    .flatMap((entry) => {
      const total = sumBy(entry.days, (day) => day.downloads)
      const shortfall = findShortfall(getPackageRepo(registry, entry.pkg), {
        downloads: total,
      })
      if (shortfall) {
        reportSkipped(`downloads for ${entry.pkg}`, shortfall)
        return []
      }
      return [{ ...entry, total }]
    })

const npmPackages = getProjectValues(PACKAGE_FIELDS.npm)
const pypiPackages = getProjectValues(PACKAGE_FIELDS.pypi)
const kept = {
  npm: keepCounted('npm', await fetchNpmHistory(npmPackages)),
  pypi: keepCounted('pypi', await fetchPypiHistory(pypiPackages)),
} satisfies Record<Registry, unknown>

/** One record of the generated file, a line for each kept package of each registry, as `formatValue` writes its value. */
const formatRecord = (
  formatValue: (entry: (typeof kept)[Registry][number]) => string
) =>
  `{
  npm: {
${kept.npm.map((entry) => `    '${entry.pkg}': ${formatValue(entry)},`).join('\n')}
  },
  pypi: {
${kept.pypi.map((entry) => `    '${entry.pkg}': ${formatValue(entry)},`).join('\n')}
  },
}`

await writeGenerated(
  TOTALS_FILE,
  'fetch:downloads',
  `import type { Registry } from '~/counts'

/** Each package's downloads in all, by registry, then package name. */
export const PACKAGE_DOWNLOAD_TOTALS: Record<
  Registry,
  Record<string, number | undefined>
> = ${formatRecord(({ total }) => String(total))}
`
)
await writeGenerated(
  HISTORY_FILE,
  'fetch:downloads',
  `import type { Registry } from '~/counts'

export type WeeklyDownloads = {
  /** ISO date of the first day counted, the package's first publish */
  firstDay: string
  /** ISO date of the last day counted, the end of the last week */
  lastDay: string
  /** Downloads in each 7-day week ending on \`lastDay\`, oldest first; the first can be shorter */
  weekly: number[]
}

export type Release = {
  version: string
  /** ISO date it was published */
  day: string
}

/** Each package's weekly downloads since its first publish, by registry, then package name. */
export const PACKAGE_DOWNLOADS: Record<
  Registry,
  Record<string, WeeklyDownloads | undefined>
> = ${formatRecord(
    ({ days }) =>
      `{ firstDay: '${days[0].day}', lastDay: '${days.at(-1)?.day}', weekly: [${sumWeeks(days).join(', ')}] }`
  )}

/** Each package's releases, oldest first and leaving out pre-releases, by registry, then package name. */
export const PACKAGE_RELEASES: Record<
  Registry,
  Record<string, Release[] | undefined>
> = ${formatRecord(({ releases }) => JSON.stringify(releases))}
`
)
console.log(
  `package downloads: totals and weekly history for ${kept.npm.length} of ${npmPackages.length} npm and ${kept.pypi.length} of ${pypiPackages.length} PyPI packages`
)
