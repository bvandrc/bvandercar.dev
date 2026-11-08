import { choosePeriods, type Periods } from '../periods'

// Three weeks to Mar 22, and the last 4 days of them one by one.
const WEEKS = {
  firstDay: '2026-03-02',
  periodEnds: ['2026-03-08', '2026-03-15', '2026-03-22'],
  counts: [5, 1200, 12],
} satisfies Omit<Periods, 'startTotal'>
const DAILY = [3, 0, 4, 1]
const LAST_DAY = '2026-03-22'

describe('choosePeriods', () => {
  it('reads day by day across a span under 50 days, from what the weeks counted before the first day', () => {
    expect(
      choosePeriods(WEEKS, DAILY, LAST_DAY, {
        start: '2026-03-19',
        end: '2026-03-22',
      })
    ).toEqual({
      firstDay: '2026-03-19',
      periodEnds: ['2026-03-19', '2026-03-20', '2026-03-21', '2026-03-22'],
      counts: DAILY,
      // 1,217 in all, less the 8 counted on the days.
      startTotal: 1209,
    })
  })

  it('reads week by week where days are too many or too few to chart', () => {
    const SPANS = [
      // Never told what it spans.
      undefined,
      // Under 50 days, but starting before the daily counts.
      { start: '2026-03-02', end: '2026-03-22' },
    ]
    for (const span of SPANS) {
      expect(
        choosePeriods(WEEKS, DAILY, LAST_DAY, span),
        JSON.stringify(span)
      ).toEqual({ ...WEEKS, startTotal: 0 })
    }
  })

  it('reads week by week across 50 days or more, though days cover it', () => {
    // From Jan 26.
    const DAILY_56 = Array<number>(56).fill(1)
    /** The first day counted across the span to `LAST_DAY` from `start`. */
    const getFirstDay = (start: string) =>
      choosePeriods(WEEKS, DAILY_56, LAST_DAY, { start, end: LAST_DAY })
        .firstDay

    // 49 days, by day, then 50, by week.
    expect(getFirstDay('2026-02-01')).toBe('2026-01-26')
    expect(getFirstDay('2026-01-31')).toBe(WEEKS.firstDay)
  })

  it('reads week by week with a single day counted, which is no line', () => {
    expect(
      choosePeriods(WEEKS, [4], LAST_DAY, {
        start: '2026-03-22',
        end: LAST_DAY,
      })
    ).toEqual({ ...WEEKS, startTotal: 0 })
  })
})
