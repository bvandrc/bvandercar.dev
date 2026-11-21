import { addDays } from '~/dates'
import { describeWeekly, sumWeeks, type Week } from '../weeks'

/** Weeks a week apart from Mar 2, with `counts` in order. */
const buildWeeks = (counts: number[]): Week[] =>
  counts.map((count, index) => ({
    start: addDays('2026-03-02', index * 7),
    end: addDays('2026-03-02', index * 7 + 6),
    count,
  }))

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

describe('describeWeekly', () => {
  it('names what it counts, the first month, and the peak week, its count in full', () => {
    expect(
      describeWeekly('commits', '2026-02-25', buildWeeks([5, 1200, 12]))
    ).toBe(
      'Weekly commits since Feb 2026, peaking at 1,200 in the week of Mar 9, 2026'
    )
  })
})
