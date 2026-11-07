import type { WeeklyDownloads } from '@/generated/npm-downloads'

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

/** The ISO date each of the history's weeks starts on, oldest first. */
export const getWeekStarts = ({ firstDay, lastDay, weekly }: WeeklyDownloads) =>
  weekly.map((_, index) => {
    const start =
      Date.parse(lastDay) - ((weekly.length - 1 - index) * 7 + 6) * DAY_MS
    // The first week can be short, starting on the first publish instead.
    return new Date(Math.max(start, Date.parse(firstDay)))
      .toISOString()
      .slice(0, 10)
  })

/** The history's busiest week: its downloads, and the ISO date it starts on. */
export const getPeakWeek = (history: WeeklyDownloads) => {
  const downloads = Math.max(...history.weekly)
  const start = getWeekStarts(history)[history.weekly.indexOf(downloads)]
  return { downloads, start }
}

/** The history in a sentence, like "Weekly npm downloads since Jul 2026, peaking at 1,010 in the week of Jul 28, 2026". */
export const describeWeeklyDownloads = (history: WeeklyDownloads) => {
  const peak = getPeakWeek(history)
  return `Weekly npm downloads since ${formatMonth(history.firstDay)}, peaking at ${peak.downloads.toLocaleString('en-US')} in the week of ${formatDay(peak.start)}`
}
