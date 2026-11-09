/**
 * Fetches the weekly download history of each npm and PyPI package the profile
 * content names, whose total its project's counts' glyph shows.
 *
 * Writes src/generated/package-downloads.ts, gitignored. Reads the package
 * names from the content `pnpm fetch:profile` copied, so run that first. Each
 * registry's fetches live in fetch-downloads/: npm.ts reads npm's APIs, and
 * pypi.ts reads PyPI's, and BigQuery's, only when
 * `GOOGLE_APPLICATION_CREDENTIALS` points at Google Cloud credentials; without
 * them, PyPI packages are skipped. A package that can't be read is left out
 * with a warning, and its glyph keeps the profile's count, rather than failing
 * the build over a stats outage. With `REUSE_FETCHED_DATA=true`, it keeps the
 * file where it already exists, as a preview build does with recent data it
 * restored from its cache.
 */

import { chunk, sumBy } from 'es-toolkit'

import type {
  DailyDownloads,
  RegistryHistory,
} from './fetch-downloads/common.ts'
import { fetchNpmHistory } from './fetch-downloads/npm.ts'
import { fetchPypiHistory } from './fetch-downloads/pypi.ts'
import { GENERATED_DIR } from './shared/constants.ts'
import { exitIfReusing, writeGenerated } from './shared/generated.ts'
import { readProjectValues } from './shared/projects.ts'

const OUT_FILE = `${GENERATED_DIR}/package-downloads.ts`

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

exitIfReusing('package downloads', [OUT_FILE])

/** The generated file's lines for one registry, one per package with downloads. */
const formatHistory = (history: RegistryHistory) =>
  history.flatMap(({ pkg, days }) => formatEntry(pkg, days))

const npmPackages = await readProjectValues('npmPackage')
const pypiPackages = await readProjectValues('pypiPackage')
const npmEntries = formatHistory(await fetchNpmHistory(npmPackages))
const pypiEntries = formatHistory(await fetchPypiHistory(pypiPackages))

await writeGenerated(
  OUT_FILE,
  'fetch:downloads',
  `/** A package registry whose downloads are counted. */
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
