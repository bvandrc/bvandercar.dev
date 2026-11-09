/**
 * Fetches the downloads of each npm and PyPI package the profile content
 * names: in all, which its project's counts' glyph shows, and day by day,
 * with its releases, for the charts in its counts' tooltip.
 *
 * Writes the totals to src/generated/package-download-totals.ts, and the
 * daily histories and releases to src/generated/package-downloads.ts, which
 * only the lazily loaded charts import, for the same packages; both
 * gitignored. Reads the
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

import { mapValues, sumBy } from 'es-toolkit'

import {
  type DownloadHistory,
  PACKAGE_FIELDS,
  type Registry,
} from '../shared/counts.ts'
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

const TOTALS_FILE = `${GENERATED_DIR}/package-download-totals.ts`
const HISTORY_FILE = `${GENERATED_DIR}/package-downloads.ts`

exitIfReusing('package downloads', [TOTALS_FILE, HISTORY_FILE])

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

/** Each registry's kept packages, by package name, as `getValue` gives each one's value. */
const byPackage = <T>(
  getValue: (entry: (typeof kept)[Registry][number]) => T
) =>
  mapValues(kept, (entries) =>
    Object.fromEntries(entries.map((entry) => [entry.pkg, getValue(entry)]))
  )

await writeGenerated(
  TOTALS_FILE,
  'fetch:downloads',
  "import type { Registry } from '~/counts'",
  [
    {
      name: 'PACKAGE_DOWNLOAD_TOTALS',
      doc: "Each package's downloads in all, by registry, then package name.",
      type: 'Record<Registry, Record<string, number | undefined>>',
      value: byPackage(({ total }) => total),
    },
  ]
)
await writeGenerated(
  HISTORY_FILE,
  'fetch:downloads',
  "import type { DownloadHistory, Registry, Release } from '~/counts'",
  [
    {
      name: 'PACKAGE_DOWNLOADS',
      doc: "Each package's daily downloads since its first publish, by registry, then package name.",
      type: 'Record<Registry, Record<string, DownloadHistory | undefined>>',
      value: byPackage(
        ({ days }): DownloadHistory => ({
          firstDay: days[0].day,
          // Every kept package has a day counted, so a last one.
          lastDay: days.at(-1)?.day ?? days[0].day,
          daily: days.map(({ downloads }) => downloads),
        })
      ),
    },
    {
      name: 'PACKAGE_RELEASES',
      doc: "Each package's releases, oldest first and leaving out pre-releases, by registry, then package name.",
      type: 'Record<Registry, Record<string, Release[] | undefined>>',
      value: byPackage(({ releases }) => releases),
    },
  ]
)
console.log(
  `package downloads: totals and daily history for ${kept.npm.length} of ${npmPackages.length} npm and ${kept.pypi.length} of ${pypiPackages.length} PyPI packages`
)
