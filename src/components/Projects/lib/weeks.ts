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
