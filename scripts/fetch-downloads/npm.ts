/**
 * npm's side of `pnpm fetch:downloads`: a package's releases, from the npm
 * registry, and its downloads per day, from npm's downloads API. Neither needs
 * credentials.
 */

import { DAY_MS } from '../shared/constants.ts'
import { isoDate } from '../shared/dates.ts'
import { fetchJson } from '../shared/http.ts'
import {
  byDay,
  type DailyDownloads,
  type RegistryHistory,
  type Release,
  warnSkipped,
} from './common.ts'

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
    firstDay: time.created.slice(0, 10),
    releases: Object.keys(versions)
      // A pre-release, like 2.0.0-beta.1, has a hyphen.
      .filter((version) => !version.includes('-'))
      .map((version): Release => ({ version, day: time[version].slice(0, 10) }))
      .sort(byDay),
  }
}

/** A package's downloads for each day from its first publish day through the last day npm has counted. */
const fetchNpmDailyDownloads = async (pkg: string, firstDay: string) => {
  const name = encodeNpmName(pkg)
  // The range API answers 0 for a day it hasn't counted yet, which would
  // read as a drop, so the range stops at the last day it has.
  const latest = await fetchJson<{ end: string }>(
    `https://api.npmjs.org/downloads/point/last-day/${name}`
  )
  const lastDay = Date.parse(latest.end)
  const days: DailyDownloads[] = []
  // The API caps each query's range, so an older package takes several.
  for (
    let start = Date.parse(firstDay);
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

/** Each of the npm `packages`' downloads per day since its first publish, and its releases, leaving out with a warning any that can't be read. */
export const fetchNpmHistory = async (
  packages: string[]
): Promise<RegistryHistory> => {
  const history: RegistryHistory = { downloads: [], releases: [] }
  for (const pkg of packages) {
    try {
      const { firstDay, releases } = await fetchNpmPackage(pkg)
      history.releases.push({ pkg, releases })
      history.downloads.push({
        pkg,
        days: await fetchNpmDailyDownloads(pkg, firstDay),
      })
    } catch (error) {
      warnSkipped(`npm downloads for ${pkg}`, error)
    }
  }
  return history
}
