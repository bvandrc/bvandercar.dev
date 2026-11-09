/**
 * npm's side of `pnpm fetch:downloads`: a package's first publish day and
 * releases, from the npm registry, and its downloads per day, from npm's
 * downloads API. Neither needs credentials.
 */

import type { Release } from '../../shared/counts.ts'
import { isoDate, listWindows } from '../../shared/dates.ts'
import { fetchJson } from '../shared/http.ts'
import { reportSkipped } from '../shared/skipped.ts'
import { byDay, type DailyDownloads, type RegistryHistory } from './common.ts'

/** Days per npm query, inside the 18 months the API answers at once. */
const NPM_WINDOW_DAYS = 365

// A scoped name's slash would otherwise read as a path segment.
const encodeNpmName = (pkg: string) => pkg.replace('/', '%2F')

/** An npm package's first publish day, and its releases, oldest first, leaving out pre-releases. */
const fetchNpmPackage = async (pkg: string) => {
  const { time, versions } = await fetchJson<{
    time: Record<string, string>
    versions: Record<string, unknown>
  }>(`https://registry.npmjs.org/${encodeNpmName(pkg)}`)
  return {
    firstDay: isoDate(Date.parse(time.created)),
    releases: Object.keys(versions)
      // A pre-release, like 2.0.0-beta.1, has a hyphen. One with no publish
      // time can't be placed, so it's left out rather than failing the rest.
      .filter((version) => !version.includes('-') && time[version])
      .map(
        (version): Release => ({
          version,
          day: isoDate(Date.parse(time[version])),
        })
      )
      .sort(byDay),
  }
}

/** A package's downloads for each day from its first publish day through the last day npm has counted. */
const fetchNpmDailyDownloads = async (pkg: string, firstDay: string) => {
  const name = encodeNpmName(pkg)
  // The range API answers 0 for a day it hasn't counted yet, which would
  // read as a drop, so the range stops at the last day it has.
  const { end: lastDay } = await fetchJson<{ end: string }>(
    `https://api.npmjs.org/downloads/point/last-day/${name}`
  )
  const days: DailyDownloads[] = []
  // The API caps each query's range, so an older package takes several.
  for (const { from, to } of listWindows(firstDay, lastDay, NPM_WINDOW_DAYS)) {
    const { downloads } = await fetchJson<{ downloads: DailyDownloads[] }>(
      `https://api.npmjs.org/downloads/range/${from}:${to}/${name}`
    )
    days.push(...downloads)
  }
  return days
}

/** Each of the npm `packages`' downloads per day since its first publish, and its releases, leaving out, and reporting, any that can't be read. */
export const fetchNpmHistory = async (
  packages: string[]
): Promise<RegistryHistory> => {
  const history: RegistryHistory = []
  for (const pkg of packages) {
    try {
      const { firstDay, releases } = await fetchNpmPackage(pkg)
      history.push({
        pkg,
        days: await fetchNpmDailyDownloads(pkg, firstDay),
        releases,
      })
    } catch (error) {
      reportSkipped(`npm downloads for ${pkg}`, error)
    }
  }
  return history
}
