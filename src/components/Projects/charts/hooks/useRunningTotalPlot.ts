import { useMemo } from 'react'

import { addDays, getDaysBetween } from '~/dates'
import { getPlotScale } from '../lib/plot'
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
 * Daily counts laid out as a running total on a plot of `span`: the totals,
 * the plot's scale, and the line's path.
 *
 * Worked out again only when the counts or the span change, not on each
 * render, as a pointer moving over the chart makes.
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
    const shownSpan = {
      start: spanStart ?? firstDay,
      end: spanEnd ?? lastDay,
    }
    // The line starts on the first day, at what was counted before it, or at
    // a span's later start, at what was counted by then.
    const lineStart =
      Date.parse(firstDay) < Date.parse(shownSpan.start)
        ? shownSpan.start
        : firstDay
    const lineStartTime = Date.parse(lineStart)
    const firstShown = days.findIndex((day) => Date.parse(day) >= lineStartTime)
    const lastShown = days.findLastIndex(
      (day) => Date.parse(day) <= Date.parse(shownSpan.end)
    )
    // The height spans what the shown stretch counts, from where the line
    // starts to the last day in view, so a short one's rise fills it too.
    const lineStartTotal = dayTotals[firstShown - 1] ?? 0
    const scale = getPlotScale(shownSpan, {
      low: lineStartTotal,
      high: dayTotals[lastShown] ?? lineStartTotal,
    })
    const { toX, toY } = scale
    const startX = toX(lineStart)
    return {
      ...scale,
      lineStartTime,
      lineStartTotal,
      startX,
      lastX: toX(lastDay),
      // Through every day, whichever periods it reads out.
      line: `M${startX},${toY(lineStartTotal)}${dayTotals
        .map((count, index) => [count, days[index]] as const)
        .slice(firstShown)
        .map(([count, day]) => `L${toX(day)},${toY(count)}`)
        .join('')}`,
    }
  }, [counted, firstDay, spanStart, spanEnd])
  return { ...counted, ...plotted }
}
