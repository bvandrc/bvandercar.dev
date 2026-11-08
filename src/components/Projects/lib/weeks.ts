import { clamp, sum } from 'es-toolkit'

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

/** How many days `isoDate` is after `from`, or before it for a negative count. */
export const getDaysBetween = (from: string, isoDate: string) =>
  Math.round((Date.parse(isoDate) - Date.parse(from)) / DAY_MS)

/** Every ISO date from `first` through `last`, oldest first. */
export const listDays = (first: string, last: string) =>
  Array.from({ length: getDaysBetween(first, last) + 1 }, (_, index) =>
    addDays(first, index)
  )

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

/**
 * The latest of versions released together, as a label: `['1.0.0', '1.0.5',
 * '1.0.1']` → `'v1.0.5'`, the one users should be on.
 *
 * Compared by their numbers, so 1.10.0 is later than 1.9.0.
 */
export const formatLatestVersion = (versions: string[]) =>
  `v${versions.toSorted((a, b) => a.localeCompare(b, 'en', { numeric: true })).at(-1)}`

/** The dates a chart runs from and to, as ISO dates or times. */
export type DaySpan = { start: string; end: string }

// How far a wheel zooms per unit of its `deltaY`: about a fifth per notch.
const WHEEL_ZOOM_RATE = 0.002
// The narrowest a zoom goes: four weeks, so there's still a line to draw, or
// a quarter of a shorter chart's span.
const MIN_ZOOM_MS = 28 * DAY_MS

/** How much a wheel's turn scales a chart's span: under 1, zooming in, for a negative `deltaY`, and over 1, zooming out, for a positive one. */
export const getWheelZoomFactor = (deltaY: number) =>
  Math.exp(deltaY * WHEEL_ZOOM_RATE)

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
  const [start, end, fullStart, fullEnd] = [
    span.start,
    span.end,
    full.start,
    full.end,
  ].map(Date.parse)
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
  // Kept to the millisecond, as ISO times, so small steps still move it.
  return {
    start: new Date(nextStart).toISOString(),
    end: new Date(nextStart + width).toISOString(),
  } satisfies DaySpan
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
  const [start, end, fullStart, fullEnd] = [
    span.start,
    span.end,
    full.start,
    full.end,
  ].map(Date.parse)
  const nextStart = clamp(start + delta, fullStart, fullEnd - (end - start))
  return {
    start: new Date(nextStart).toISOString(),
    end: new Date(nextStart + end - start).toISOString(),
  } satisfies DaySpan
}
