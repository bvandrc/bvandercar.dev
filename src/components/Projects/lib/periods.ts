import { sum } from 'es-toolkit'

import { addDays, type DaySpan } from './weeks'

const DAY_MS = 24 * 60 * 60 * 1000
// A chart spanning fewer days than this reads day by day rather than week by
// week, where weeks would be too few points to show its shape.
const DAILY_SPAN_DAYS = 50

/** Counts per period for a running total, and what it had counted before the first. */
export type Periods = {
  /** The ISO date counting starts on, the first period's first day */
  firstDay: string
  /** The ISO date each period ends on, oldest first */
  periodEnds: string[]
  /** Its count in each period, one per entry of `periodEnds` */
  counts: number[]
  /** What was counted before `firstDay` */
  startTotal: number
}

/**
 * Weekly counts, or the latest daily ones in their place across a span under
 * 50 days that they cover.
 *
 * The daily counts end on `lastDay`. They start from what the weeks had
 * counted before them, so either way the total ends the same. Weeks without a
 * span.
 */
export const choosePeriods = (
  weeks: Omit<Periods, 'startTotal'>,
  daily: number[],
  lastDay: string,
  span: DaySpan | undefined
): Periods => {
  const days = daily.map((_, index) =>
    addDays(lastDay, index - (daily.length - 1))
  )
  const isDaily =
    span !== undefined &&
    days.length > 1 &&
    days[0] <= span.start &&
    Date.parse(span.end) - Date.parse(span.start) < DAILY_SPAN_DAYS * DAY_MS
  return isDaily
    ? {
        firstDay: days[0],
        periodEnds: days,
        counts: daily,
        startTotal: sum(weeks.counts) - sum(daily),
      }
    : { ...weeks, startTotal: 0 }
}
