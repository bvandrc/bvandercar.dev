import type { Release } from '@/generated/package-downloads'

const DAY_MS = 24 * 60 * 60 * 1000

// The dates are calendar days, so they're read in UTC, where they start.
const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const DAY_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

/** An ISO date as its month: `'2026-03-02'` → `'Mar 2026'`. */
export const formatMonth = (isoDate: string) =>
  MONTH_FORMAT.format(Date.parse(isoDate))

/** An ISO date in full: `'2026-03-02'` → `'Mar 2, 2026'`. */
export const formatDay = (isoDate: string) =>
  DAY_FORMAT.format(Date.parse(isoDate))

/** The ISO date `days` after `isoDate`, or before it for a negative count. */
export const addDays = (isoDate: string, days: number) =>
  new Date(Date.parse(isoDate) + days * DAY_MS).toISOString().slice(0, 10)

/** The busiest of weekly counts: its count, and the ISO date its week starts on. */
export const getPeakWeek = (weekly: number[], weekStarts: string[]) => {
  const count = Math.max(...weekly)
  return { count, start: weekStarts[weekly.indexOf(count)] }
}

/**
 * Each week, by its index in `weekEnds`, that had a release, and the versions
 * released in it, oldest first.
 *
 * A release from before the first week or after the last is left out.
 */
export const getReleaseWeeks = (releases: Release[], weekEnds: string[]) => {
  const firstDay = addDays(weekEnds[0], -6)
  const weeks = new Map<number, string[]>()
  for (const { version, day } of releases.toSorted((a, b) =>
    a.day.localeCompare(b.day)
  )) {
    const index = weekEnds.findIndex((end) => day <= end)
    if (day >= firstDay && index !== -1) {
      weeks.set(index, [...(weeks.get(index) ?? []), version])
    }
  }
  return weeks
}

/** Versions released together, as one label: `['1.2.0']` → `'v1.2.0'`, `['1.0.0', '1.0.1', '1.0.5']` → `'v1.0.0–v1.0.5'`. */
export const formatVersions = (versions: string[]) =>
  versions.length > 1
    ? `v${versions[0]}–v${versions.at(-1)}`
    : `v${versions[0]}`
