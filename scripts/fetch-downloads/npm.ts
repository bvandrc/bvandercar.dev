/**
 * npm's side of `pnpm fetch:downloads`: a package's first publish day, from
 * the npm registry, and its downloads per day, from npm's downloads API.
 * Neither needs credentials.
 */

import { DAY_MS } from '../shared/constants.ts'
import { isoDate } from '../shared/dates.ts'
import { fetchJson } from '../shared/http.ts'
import {
  type DailyDownloads,
  type RegistryHistory,
  warnSkipped,
} from './common.ts'

/** Days per npm query, inside the 18 months the API answers at once. */
const NPM_WINDOW_DAYS = 365

// A scoped name's slash would otherwise read as a path segment.
const encodeNpmName = (pkg: string) => pkg.replace('/', '%2F')

/** The ISO date an npm package was first published. */
const fetchNpmFirstDay = async (pkg: string) => {
  const { time } = await fetchJson<{ time: { created: string } }>(
    `https://registry.npmjs.org/${encodeNpmName(pkg)}`
  )
  return time.created.slice(0, 10)
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

/** Each of the npm `packages`' downloads per day since its first publish, leaving out with a warning any that can't be read. */
export const fetchNpmHistory = async (
  packages: string[]
): Promise<RegistryHistory> => {
  const history: RegistryHistory = []
  for (const pkg of packages) {
    try {
      const firstDay = await fetchNpmFirstDay(pkg)
      history.push({ pkg, days: await fetchNpmDailyDownloads(pkg, firstDay) })
    } catch (error) {
      warnSkipped(`npm downloads for ${pkg}`, error)
    }
  }
  return history
}
