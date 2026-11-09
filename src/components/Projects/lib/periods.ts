import { DAY_MS, listDays } from '~/dates'
import type { DaySpan } from './weeks'

// A chart spanning fewer days than this reads out day by day rather than week
// by week, where weeks would be too few to point at.
const DAILY_SPAN_DAYS = 50

/**
 * The ISO dates a chart across `span` reads out: every day from `firstDay`
 * through `lastDay` across a span under 50 days, or else `weekEnds`.
 *
 * Without a span, `weekEnds`.
 */
export const getPeriodEnds = (
  weekEnds: string[],
  firstDay: string,
  lastDay: string,
  span: DaySpan | undefined
) =>
  span !== undefined &&
  Date.parse(span.end) - Date.parse(span.start) < DAILY_SPAN_DAYS * DAY_MS
    ? listDays(firstDay, lastDay)
    : weekEnds
