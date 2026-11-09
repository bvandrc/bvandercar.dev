import { getPeriodEnds } from '../periods'

const WEEK_ENDS = ['2026-03-08', '2026-03-15', '2026-03-22']
const FIRST_DAY = '2026-03-02'
const LAST_DAY = '2026-03-22'

describe('getPeriodEnds', () => {
  it('reads out every day across a span under 50 days', () => {
    const days = getPeriodEnds(WEEK_ENDS, FIRST_DAY, LAST_DAY, {
      start: '2026-03-10',
      end: LAST_DAY,
    })

    expect(days).toHaveLength(21)
    expect([days[0], days.at(-1)]).toEqual([FIRST_DAY, LAST_DAY])
    // 49 days, the longest that does.
    expect(
      getPeriodEnds(WEEK_ENDS, FIRST_DAY, LAST_DAY, {
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
      expect(
        getPeriodEnds(WEEK_ENDS, FIRST_DAY, LAST_DAY, span),
        JSON.stringify(span)
      ).toBe(WEEK_ENDS)
    }
  })
})
