import type { WeeklyActivity } from '@/generated/repo-activity'
import {
  describeWeeklyCommits,
  getActivityWeekEnds,
  getActivityWeekStarts,
} from '../weekly-activity'

// Read on a Sunday, the day its last week ends.
const ACTIVITY = {
  firstWeek: '2026-02-23',
  lastDay: '2026-03-15',
  commits: [3, 40, 12],
  prs: [1, 9, 4],
} satisfies WeeklyActivity

describe('getActivityWeekStarts', () => {
  it('starts each week 7 days after the last, from the first', () => {
    expect(getActivityWeekStarts(ACTIVITY)).toEqual([
      '2026-02-23',
      '2026-03-02',
      '2026-03-09',
    ])
  })
})

describe('getActivityWeekEnds', () => {
  it('ends each week on the Sunday 6 days after it starts', () => {
    expect(getActivityWeekEnds(ACTIVITY)).toEqual([
      '2026-03-01',
      '2026-03-08',
      '2026-03-15',
    ])
  })

  it('ends the week under way on the day it was read', () => {
    expect(
      getActivityWeekEnds({ ...ACTIVITY, lastDay: '2026-03-12' }).at(-1)
    ).toBe('2026-03-12')
  })
})

describe('describeWeeklyCommits', () => {
  it('names the first month and the week with the most commits', () => {
    expect(describeWeeklyCommits(ACTIVITY)).toBe(
      'Weekly commits since Feb 2026, peaking at 40 in the week of Mar 2, 2026'
    )
  })
})
