import { getPeriodAt, getPeriodEnds } from '../periods'

const WEEK_ENDS = ['2026-03-08', '2026-03-15', '2026-03-22']
const FIRST_DAY = '2026-03-02'
const LAST_DAY = '2026-03-22'
const DAYS = { firstDay: FIRST_DAY, lastDay: LAST_DAY }

describe('getPeriodEnds', () => {
  it('reads out every day across a span under 50 days', () => {
    const days = getPeriodEnds(WEEK_ENDS, DAYS, {
      start: '2026-03-10',
      end: LAST_DAY,
    })

    expect(days).toHaveLength(21)
    expect([days[0], days.at(-1)]).toEqual([FIRST_DAY, LAST_DAY])
    // 49 days, the longest that does.
    expect(
      getPeriodEnds(WEEK_ENDS, DAYS, {
        start: '2026-02-02',
        end: '2026-03-23',
      })
    ).toHaveLength(21)
  })

  it('reads out each week across 50 days or more, or without a span', () => {
    const SPANS = [
      // 50 days.
      { start: '2026-02-01', end: '2026-03-23' },
      undefined,
    ]
    for (const span of SPANS) {
      expect(getPeriodEnds(WEEK_ENDS, DAYS, span), JSON.stringify(span)).toBe(
        WEEK_ENDS
      )
    }
  })
})

describe('getPeriodAt', () => {
  const END = Date.parse(LAST_DAY)

  it('finds the period a time falls in, the first or last past either end', () => {
    const CASES = [
      ['2026-02-01', 0],
      // A period's last day, through its end.
      ['2026-03-08T23:00:00Z', 0],
      ['2026-03-09', 1],
      ['2026-04-01', 2],
    ] as const
    for (const [day, expected] of CASES) {
      expect(getPeriodAt(WEEK_ENDS, Date.parse(day), END), day).toBe(expected)
    }
  })

  it('falls back a period where the one it falls in ends out of view, as a zoomed-in span can', () => {
    // Mar 10 is in the week ending Mar 15, past a span ending Mar 12.
    expect(
      getPeriodAt(WEEK_ENDS, Date.parse('2026-03-10'), Date.parse('2026-03-12'))
    ).toBe(0)
  })
})
