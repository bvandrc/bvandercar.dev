import { DAY_MS, listDays } from '~/dates'
import { type DaySpan, getSpanMs } from './spans'

// A chart spanning fewer days than this reads out day by day rather than week
// by week, where weeks would be too few to point at.
const DAILY_SPAN_DAYS = 50

/**
 * The ISO dates a chart of a history across `span` reads out: every day it
 * counts across a span under 50 days, or else `weekEnds`.
 *
 * Without a span, `weekEnds`.
 */
export const getPeriodEnds = (
  weekEnds: string[],
  { firstDay, lastDay }: { firstDay: string; lastDay: string },
  span: DaySpan | undefined
) =>
  span !== undefined && getSpanMs(span) < DAILY_SPAN_DAYS * DAY_MS
    ? listDays(firstDay, lastDay)
    : weekEnds

/**
 * Which of `periodEnds`, ISO dates oldest first, ends the period the day at
 * `time` falls in, by index: the last for a time past them all.
 *
 * Where that period ends after `end`, out of view, as a zoomed-in span can,
 * the period before it instead.
 */
export const getPeriodAt = (
  periodEnds: string[],
  time: number,
  end: number
) => {
  const index = periodEnds.findIndex(
    (periodEnd) => Date.parse(periodEnd) + DAY_MS > time
  )
  const period = index === -1 ? periodEnds.length - 1 : index
  return Date.parse(periodEnds[period]) > end ? Math.max(period - 1, 0) : period
}
