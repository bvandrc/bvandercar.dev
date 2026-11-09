/**
 * Fetches the weekly download history of each npm and PyPI package the profile
 * content names, whose total its project's counts' glyph shows, and its
 * release dates.
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

import type { DailyDownloads, Release } from './fetch-downloads/common.ts'
import {
  fetchNpmDailyDownloads,
  fetchNpmPackage,
} from './fetch-downloads/npm.ts'
import {
  fetchPypiDailyDownloads,
  fetchPypiPackage,
  hasGoogleCredentials,
  readPypiCache,
  writePypiCache,
} from './fetch-downloads/pypi.ts'
import { GENERATED_DIR } from './shared/constants.ts'
import { getErrorMessage } from './shared/errors.ts'
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

const warnSkipped = (what: string, error: unknown) =>
  console.warn(
    `::warning::${what} could not be read, so its glyph keeps the profile's count: ${getErrorMessage(error)}`
  )

exitIfReusing('package downloads', [OUT_FILE])

/** A line of the generated file listing one package's releases. */
const formatReleases = (pkg: string, releases: Release[]) =>
  `    '${pkg}': ${JSON.stringify(releases)},`

const npmPackages = await readProjectValues('npmPackage')
const npmEntries: string[] = []
const npmReleaseEntries: string[] = []
for (const pkg of npmPackages) {
  try {
    const { firstDay, releases } = await fetchNpmPackage(pkg)
    npmReleaseEntries.push(formatReleases(pkg, releases))
    npmEntries.push(
      ...formatEntry(pkg, await fetchNpmDailyDownloads(pkg, firstDay))
    )
  } catch (error) {
    warnSkipped(`npm downloads for ${pkg}`, error)
  }
}

const pypiPackages = await readProjectValues('pypiPackage')
const pypiEntries: string[] = []
const pypiReleaseEntries: string[] = []
// Releases need no credentials, so they're read even when downloads aren't.
const pypiFirstDays: { pkg: string; firstDay: string }[] = []
const pypiResults = await Promise.allSettled(pypiPackages.map(fetchPypiPackage))
pypiResults.forEach((result, index) => {
  const pkg = pypiPackages[index]
  if (result.status === 'rejected') {
    warnSkipped(`PyPI releases for ${pkg}`, result.reason)
  } else {
    pypiReleaseEntries.push(formatReleases(pkg, result.value.releases))
    pypiFirstDays.push({ pkg, firstDay: result.value.firstDay })
  }
})
if (pypiFirstDays.length > 0 && !hasGoogleCredentials) {
  console.warn(
    "::notice::GOOGLE_APPLICATION_CREDENTIALS is not set, so PyPI packages' glyphs keep the profile's counts"
  )
} else if (pypiFirstDays.length > 0) {
  try {
    const cache = await readPypiCache()
    try {
      const histories = await fetchPypiDailyDownloads(pypiFirstDays, cache)
      pypiFirstDays.forEach(({ pkg }, index) => {
        pypiEntries.push(...formatEntry(pkg, histories[index]))
      })
    } finally {
      await writePypiCache(cache)
    }
  } catch (error) {
    warnSkipped('PyPI downloads', error)
  }
}

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

export type Release = {
  version: string
  /** ISO date it was published */
  day: string
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

/** Each package's releases, oldest first and leaving out pre-releases, by registry, then package name. */
export const PACKAGE_RELEASES: Record<
  Registry,
  Record<string, Release[] | undefined>
> = {
  npm: {
${npmReleaseEntries.join('\n')}
  },
  pypi: {
${pypiReleaseEntries.join('\n')}
  },
}
`
)
console.log(
  `package downloads: weekly history for ${npmEntries.length} of ${npmPackages.length} npm and ${pypiEntries.length} of ${pypiPackages.length} PyPI packages`
)
