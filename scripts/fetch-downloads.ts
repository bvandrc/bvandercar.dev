/**
 * Fetches the downloads in all of each npm and PyPI package the profile
 * content names, which its project's counts' glyph shows.
 *
 * Writes src/generated/package-download-totals.ts, gitignored. Reads the
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

import { sumBy } from 'es-toolkit'

import type { RegistryHistory } from './fetch-downloads/common.ts'
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

const OUT_FILE = `${GENERATED_DIR}/package-download-totals.ts`

exitIfReusing('package downloads', [OUT_FILE])

/**
 * The generated file's lines for one registry: each package's total.
 *
 * Leaves out one with no days counted yet, and reports one whose total is
 * fewer than its profile count, which is older, so the fetch missed some.
 */
const formatTotals = (
  field: 'npmPackage' | 'pypiPackage',
  history: RegistryHistory
) =>
  history
    .filter(({ days }) => days.length > 0)
    .flatMap(({ pkg, days }) => {
      const downloads = sumBy(days, (day) => day.downloads)
      const shortfall = findShortfall(getPackageRepo(field, pkg), { downloads })
      if (shortfall) {
        reportSkipped(`downloads for ${pkg}`, shortfall)
        return []
      }
      return [`    '${pkg}': ${downloads},`]
    })

const npmPackages = getProjectValues('npmPackage')
const pypiPackages = getProjectValues('pypiPackage')
const npmEntries = formatTotals(
  'npmPackage',
  await fetchNpmHistory(npmPackages)
)
const pypiEntries = formatTotals(
  'pypiPackage',
  await fetchPypiHistory(pypiPackages)
)

await writeGenerated(
  OUT_FILE,
  'fetch:downloads',
  `/** A package registry whose downloads are counted. */
export type Registry = 'npm' | 'pypi'

/** Each package's downloads in all, by registry, then package name. */
export const PACKAGE_DOWNLOAD_TOTALS: Record<
  Registry,
  Record<string, number | undefined>
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
  `package downloads: totals for ${npmEntries.length} of ${npmPackages.length} npm and ${pypiEntries.length} of ${pypiPackages.length} PyPI packages`
)
