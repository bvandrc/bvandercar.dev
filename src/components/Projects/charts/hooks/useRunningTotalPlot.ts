import { useMemo } from 'react'

import type { LineChartPoint } from '@/components/primitives/LineChart'
import { addDays, getDaysBetween } from '~/dates'
import type { DaySpan } from '../lib/spans'
import { getRunningTotals } from '../lib/weeks'

export type RunningTotalPlotOptions = {
  /** The ISO date counting starts on */
  firstDay: string
  /** The count on each day from `firstDay` on, oldest first; two or more */
  daily: number[]
  /** The ISO date each period read out ends on, oldest first */
  periodEnds: string[]
  /** The ISO dates the plot runs from and to; its own days' where left out */
  span?: DaySpan
}

/**
 * Daily counts laid out as a running total over `span`, for a `LineChart`:
 * the totals, and the line's points, domain, and range, along x as times.
 *
 * Worked out again only when the counts or the span change.
 */
export const useRunningTotalPlot = ({
  firstDay,
  daily,
  periodEnds,
  span,
}: RunningTotalPlotOptions) => {
  const counted = useMemo(() => {
    const days = daily.map((_, index) => addDays(firstDay, index))
    const dayTotals = getRunningTotals(daily)
    return {
      days,
      dayTotals,
      // It counts two days or more, so has a last.
      lastDay: days.at(-1) ?? firstDay,
      // A running total only grows, so it peaks at the end.
      total: dayTotals.at(-1) ?? 0,
      periodTotals: periodEnds.map(
        (periodEnd) => dayTotals[getDaysBetween(firstDay, periodEnd)]
      ),
    }
  }, [firstDay, daily, periodEnds])
  const spanStart = span?.start
  const spanEnd = span?.end
  const plotted = useMemo(() => {
    const { days, dayTotals, lastDay } = counted
    // Compared as times, not strings: a zoomed-in span's ends are ISO times,
    // which sort after the plain ISO date of the same day.
    const domain = {
      start: Date.parse(spanStart ?? firstDay),
      end: Date.parse(spanEnd ?? lastDay),
    }
    // The line starts on the first day, at what was counted before it, or at
    // a span's later start, at what was counted by then.
    const lineStartTime = Math.max(Date.parse(firstDay), domain.start)
    const firstShown = days.findIndex((day) => Date.parse(day) >= lineStartTime)
    const lastShown = days.findLastIndex((day) => Date.parse(day) <= domain.end)
    // The height spans what the shown stretch counts, from where the line
    // starts to the last day in view, so a short one's rise fills it too.
    const lineStartTotal = dayTotals[firstShown - 1] ?? 0
    return {
      domain,
      range: {
        low: lineStartTotal,
        high: dayTotals[lastShown] ?? lineStartTotal,
      },
      lineStartTotal,
      // Through every day, whichever periods it reads out.
      points: [
        { x: lineStartTime, y: lineStartTotal },
        ...days
          .map((day, index) => ({ x: Date.parse(day), y: dayTotals[index] }))
          .slice(firstShown),
      ] satisfies LineChartPoint[],
    }
  }, [counted, firstDay, spanStart, spanEnd])
  return { ...counted, ...plotted }
}
