import { addDays, DAY_MS } from '~/dates'
import {
  formatLatestVersion,
  getPeakWeek,
  panSpan,
  sumWeeks,
  type Week,
  zoomSpan,
} from '../weeks'

describe('sumWeeks', () => {
  it('sums daily counts into weeks ending on each week end, the first starting on the first day', () => {
    expect(
      sumWeeks(
        '2026-03-04',
        [1, 2, 3, 4, 5, 6, 7, 8],
        ['2026-03-06', '2026-03-11']
      )
    ).toEqual([
      { start: '2026-03-04', end: '2026-03-06', count: 6 },
      { start: '2026-03-07', end: '2026-03-11', count: 30 },
    ])
  })
})

describe('getPeakWeek', () => {
  /** Weeks a week apart from Mar 2, with `counts` in order. */
  const buildWeeks = (counts: number[]): Week[] =>
    counts.map((count, index) => ({
      start: addDays('2026-03-02', index * 7),
      end: addDays('2026-03-02', index * 7 + 6),
      count,
    }))

  it('finds the week with the highest count', () => {
    expect(getPeakWeek(buildWeeks([5, 40, 12]))).toMatchObject({
      count: 40,
      start: '2026-03-09',
    })
  })

  it('takes the earliest of weeks that tie', () => {
    expect(getPeakWeek(buildWeeks([40, 40, 12]))).toMatchObject({
      count: 40,
      start: '2026-03-02',
    })
  })
})

describe('formatLatestVersion', () => {
  it('names only the latest of several, by their numbers rather than their order', () => {
    // 1.10.0 sorts before 1.9.0 as text.
    expect(formatLatestVersion(['1.9.0', '1.10.0', '1.0.5'])).toBe('v1.10.0')
  })
})

describe('zoomSpan', () => {
  const FULL = { start: '2025-04-11', end: '2026-04-11' }
  /** A span's width, in days. */
  const getDays = ({ start, end }: { start: string; end: string }) =>
    (Date.parse(end) - Date.parse(start)) / DAY_MS
  /** How far across a span a time falls, from 0 to 1. */
  const getFraction = (
    { start, end }: { start: string; end: string },
    time: number
  ) => (time - Date.parse(start)) / (Date.parse(end) - Date.parse(start))

  it('zooms in for a factor under 1, keeping the anchor where it was across the span', () => {
    const ANCHOR = Date.parse('2026-03-01')
    const zoomed = zoomSpan(FULL, FULL, ANCHOR, 0.5)

    expect(zoomed).toBeDefined()
    expect(getDays(zoomed ?? FULL)).toBeCloseTo(getDays(FULL) / 2)
    expect(getFraction(zoomed ?? FULL, ANCHOR)).toBeCloseTo(
      getFraction(FULL, ANCHOR)
    )
  })

  it('goes no narrower than four weeks', () => {
    const zoomed = zoomSpan(FULL, FULL, Date.parse('2026-02-01'), 0.001)

    expect(getDays(zoomed ?? FULL)).toBeCloseTo(28)
  })

  it('goes no narrower than a quarter of a span shorter than 16 weeks', () => {
    const SHORT = { start: '2026-03-01', end: '2026-03-21' }
    const zoomed = zoomSpan(SHORT, SHORT, Date.parse('2026-03-10'), 0.001)

    expect(getDays(zoomed ?? SHORT)).toBeCloseTo(5)
  })

  it('stays within the full span when zooming out near an edge', () => {
    const ZOOMED = { start: '2026-03-20', end: '2026-04-11' }
    const zoomed = zoomSpan(ZOOMED, FULL, Date.parse('2026-04-10'), 1.25)

    expect(zoomed?.end).toBe(new Date(Date.parse(FULL.end)).toISOString())
  })

  it('returns nothing once zoomed back out to the full span', () => {
    expect(zoomSpan(FULL, FULL, Date.parse('2026-02-01'), 2)).toBeUndefined()
  })
})

describe('panSpan', () => {
  const FULL = { start: '2026-01-01', end: '2026-04-11' }
  const ZOOMED = { start: '2026-02-01', end: '2026-03-01' }

  it('moves a zoomed-in span later or earlier, keeping its width', () => {
    expect(panSpan(ZOOMED, FULL, 7 * DAY_MS)).toEqual({
      start: '2026-02-08T00:00:00.000Z',
      end: '2026-03-08T00:00:00.000Z',
    })
  })

  it("stops at the full span's edges", () => {
    expect(panSpan(ZOOMED, FULL, -365 * DAY_MS)).toEqual({
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-29T00:00:00.000Z',
    })
  })

  it("leaves a span that isn't zoomed in where it is", () => {
    expect(panSpan(undefined, FULL, 7 * DAY_MS)).toBeUndefined()
  })
})
