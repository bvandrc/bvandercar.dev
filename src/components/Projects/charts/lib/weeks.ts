import { sum } from 'es-toolkit'

import { formatNumber } from '@/lib/format-count'
import { formatDay, formatMonth } from '@/lib/format-date'
import { addDays, getDaysBetween } from '~/dates'

/** A week of daily counts: the ISO dates it starts and ends on, and what it counted. */
export type Week = { start: string; end: string; count: number }

/**
 * Daily counts from `firstDay` summed into weeks ending on each of
 * `weekEnds`, oldest first.
 *
 * Each starts the day after the one before, and the first on `firstDay`, so
 * it can be short.
 */
export const sumWeeks = (
  firstDay: string,
  daily: number[],
  weekEnds: string[]
): Week[] =>
  weekEnds.map((end, index) => {
    const start = index === 0 ? firstDay : addDays(weekEnds[index - 1], 1)
    const count = sum(
      daily.slice(
        getDaysBetween(firstDay, start),
        getDaysBetween(firstDay, end) + 1
      )
    )
    return { start, end, count }
  })

/** The busiest of weeks, the earliest of any that tie. */
export const getPeakWeek = (weeks: Week[]) =>
  weeks.reduce((peak, week) => (week.count > peak.count ? week : peak))

/** Weekly counts in a sentence, like "Weekly commits since Mar 2025, peaking at 40 in the week of Mar 2, 2026", for `what` counted since `firstDay`. */
export const describeWeekly = (
  what: string,
  firstDay: string,
  weeks: Week[]
) => {
  const peak = getPeakWeek(weeks)
  return `Weekly ${what} since ${formatMonth(firstDay)}, peaking at ${formatNumber(peak.count)} in the week of ${formatDay(peak.start)}`
}

/** Daily counts as a running total, through each day: `[1, 0, 2]` → `[1, 1, 3]`. */
export const getRunningTotals = (daily: number[]) => {
  let total = 0
  return daily.map((count) => {
    total += count
    return total
  })
}

/**
 * The latest of versions released together, as a label: `['1.0.0', '1.0.5',
 * '1.0.1']` → `'v1.0.5'`, the one users should be on.
 *
 * Compared by their numbers, so 1.10.0 is later than 1.9.0.
 */
export const formatLatestVersion = (versions: string[]) =>
  `v${versions.toSorted((a, b) => a.localeCompare(b, 'en', { numeric: true })).at(-1)}`
