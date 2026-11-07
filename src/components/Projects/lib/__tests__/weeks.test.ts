import {
  addDays,
  formatDay,
  formatMonth,
  formatVersions,
  getPeakWeek,
  getReleaseWeeks,
  zoomSpan,
} from '../weeks'

describe('formatMonth', () => {
  it('writes an ISO date as its month and year', () => {
    expect(formatMonth('2026-03-02')).toBe('Mar 2026')
  })
})

describe('formatDay', () => {
  it('writes an ISO date in full', () => {
    expect(formatDay('2026-03-01')).toBe('Mar 1, 2026')
  })
})

describe('addDays', () => {
  it('moves an ISO date forward or back, across month ends', () => {
    expect(addDays('2026-02-26', 7)).toBe('2026-03-05')
    expect(addDays('2026-03-05', -7)).toBe('2026-02-26')
  })
})

describe('getPeakWeek', () => {
  const WEEK_STARTS = ['2026-03-02', '2026-03-09', '2026-03-16']

  it('finds the week with the highest count, and when it starts', () => {
    expect(getPeakWeek([5, 40, 12], WEEK_STARTS)).toEqual({
      count: 40,
      start: '2026-03-09',
    })
  })

  it('takes the earliest of weeks that tie', () => {
    expect(getPeakWeek([40, 40, 12], WEEK_STARTS)).toEqual({
      count: 40,
      start: '2026-03-02',
    })
  })
})

describe('getReleaseWeeks', () => {
  const WEEK_ENDS = ['2026-03-08', '2026-03-15', '2026-03-22']

  it('groups releases by the week they fall in, oldest version first', () => {
    const weeks = getReleaseWeeks(
      [
        { version: '1.1.0', day: '2026-03-15' },
        { version: '1.0.0', day: '2026-03-02' },
        { version: '1.0.1', day: '2026-03-09' },
      ],
      WEEK_ENDS
    )
    expect([...weeks]).toEqual([
      [0, ['1.0.0']],
      // The 9th starts the second week, and the 15th ends it.
      [1, ['1.0.1', '1.1.0']],
    ])
  })

  it('leaves out releases from before the first week or after the last', () => {
    const weeks = getReleaseWeeks(
      [
        { version: '0.9.0', day: '2026-03-01' },
        { version: '2.0.0', day: '2026-03-23' },
      ],
      WEEK_ENDS
    )
    expect(weeks.size).toBe(0)
  })
})

describe('formatVersions', () => {
  it('names a lone version', () => {
    expect(formatVersions(['1.2.0'])).toBe('v1.2.0')
  })

  it('spans several versions from the first to the last', () => {
    expect(formatVersions(['1.0.0', '1.0.1', '1.0.5'])).toBe('v1.0.0–v1.0.5')
  })
})

describe('zoomSpan', () => {
  const FULL = { start: '2025-04-11', end: '2026-04-11' }
  const DAY_MS = 24 * 60 * 60 * 1000
  /** A span's width, in days. */
  const getDays = ({ start, end }: { start: string; end: string }) =>
    (Date.parse(end) - Date.parse(start)) / DAY_MS
  /** How far across a span a time falls, from 0 to 1. */
  const getFraction = (
    { start, end }: { start: string; end: string },
    time: number
  ) => (time - Date.parse(start)) / (Date.parse(end) - Date.parse(start))

  it('zooms in for a wheel turned up, keeping the anchor where it was across the span', () => {
    const ANCHOR = Date.parse('2026-03-01')
    const zoomed = zoomSpan(FULL, FULL, ANCHOR, -200)

    expect(zoomed).toBeDefined()
    expect(getDays(zoomed ?? FULL)).toBeLessThan(getDays(FULL))
    expect(getFraction(zoomed ?? FULL, ANCHOR)).toBeCloseTo(
      getFraction(FULL, ANCHOR)
    )
  })

  it('goes no narrower than four weeks', () => {
    const zoomed = zoomSpan(FULL, FULL, Date.parse('2026-02-01'), -100_000)

    expect(getDays(zoomed ?? FULL)).toBeCloseTo(28)
  })

  it('goes no narrower than a quarter of a span shorter than 16 weeks', () => {
    const SHORT = { start: '2026-03-01', end: '2026-03-21' }
    const zoomed = zoomSpan(SHORT, SHORT, Date.parse('2026-03-10'), -100_000)

    expect(getDays(zoomed ?? SHORT)).toBeCloseTo(5)
  })

  it('stays within the full span when zooming out near an edge', () => {
    const ZOOMED = { start: '2026-03-20', end: '2026-04-11' }
    const zoomed = zoomSpan(ZOOMED, FULL, Date.parse('2026-04-10'), 100)

    expect(zoomed?.end).toBe(new Date(Date.parse(FULL.end)).toISOString())
  })

  it('returns nothing once zoomed back out to the full span', () => {
    expect(zoomSpan(FULL, FULL, Date.parse('2026-02-01'), 400)).toBeUndefined()
  })
})
