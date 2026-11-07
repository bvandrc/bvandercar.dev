import { clamp } from 'es-toolkit'

import type { Release } from '@/generated/package-downloads'

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

/**
 * Each week, by its index in `weekEnds`, that had a release, and the versions
 * released in it, oldest first.
 *
 * A release from before the first week or after the last is left out.
 */
export const getReleaseWeeks = (releases: Release[], weekEnds: string[]) => {
  const firstDay = addDays(weekEnds[0], -6)
  const weeks = new Map<number, string[]>()
  for (const { version, day } of releases.toSorted((a, b) =>
    a.day.localeCompare(b.day)
  )) {
    const index = weekEnds.findIndex((end) => day <= end)
    if (day >= firstDay && index !== -1) {
      weeks.set(index, [...(weeks.get(index) ?? []), version])
    }
  }
  return weeks
}

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
