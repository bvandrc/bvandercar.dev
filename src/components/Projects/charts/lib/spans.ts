import { clamp } from 'es-toolkit'

import { DAY_MS } from '~/dates'

/** The dates a chart runs from and to, as ISO dates or times. */
export type DaySpan = { start: string; end: string }

/** The shortest stretch of dates charts are drawn over: two weeks. */
export const MIN_CHART_MS = 14 * DAY_MS

// The narrowest a zoom goes: four weeks, so there's still a line to draw, or
// a quarter of a shorter chart's span.
const MIN_ZOOM_MS = 28 * DAY_MS

/** A span's start and end, as times. */
const getSpanTimes = ({ start, end }: DaySpan) =>
  [Date.parse(start), Date.parse(end)] as const

/** The span `width` milliseconds wide from the time `start`, kept to the millisecond, as ISO times, so small steps still move it. */
const toSpan = (start: number, width: number): DaySpan => ({
  start: new Date(start).toISOString(),
  end: new Date(start + width).toISOString(),
})

/** How long a span is, in milliseconds. */
export const getSpanMs = (span: DaySpan) => {
  const [start, end] = getSpanTimes(span)
  return end - start
}

/**
 * `span` zoomed around `anchor`, a time within it, its width scaled by
 * `factor`: in for one under 1, out for one over.
 *
 * The anchor keeps its place across the chart. The result stays within
 * `full`, and no narrower than four weeks, or a quarter of `full` if that's
 * narrower. It's undefined once it's back out to `full`.
 */
export const zoomSpan = (
  span: DaySpan,
  full: DaySpan,
  anchor: number,
  factor: number
) => {
  const [start, end] = getSpanTimes(span)
  const [fullStart, fullEnd] = getSpanTimes(full)
  const fullWidth = fullEnd - fullStart
  const width = clamp(
    (end - start) * factor,
    Math.min(MIN_ZOOM_MS, fullWidth / 4),
    fullWidth
  )
  if (width >= fullWidth) {
    return undefined
  }
  const nextStart = clamp(
    anchor - (anchor - start) * (width / (end - start)),
    fullStart,
    fullEnd - width
  )
  return toSpan(nextStart, width)
}

/**
 * A zoomed-in `span` moved `delta` milliseconds later, or earlier for a
 * negative one, kept within `full`.
 *
 * Undefined for one that isn't zoomed in, which has nowhere to move.
 */
export const panSpan = (
  span: DaySpan | undefined,
  full: DaySpan,
  delta: number
) => {
  if (!span) {
    return undefined
  }
  const [start, end] = getSpanTimes(span)
  const [fullStart, fullEnd] = getSpanTimes(full)
  const width = end - start
  return toSpan(clamp(start + delta, fullStart, fullEnd - width), width)
}
