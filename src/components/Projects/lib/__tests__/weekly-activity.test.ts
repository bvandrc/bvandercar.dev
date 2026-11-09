import type { WeeklyActivity } from '@/generated/repo-activity'
import {
  describeWeeklyCommits,
  getActivityWeekEnds,
  getWeekReachingCommits,
} from '../weekly-activity'

// Read on a Sunday, the day its last week ends.
const ACTIVITY = {
  firstWeek: '2026-02-23',
  lastDay: '2026-03-15',
  commits: [3, 40, 12],
  prs: [1, 9, 4],
} satisfies WeeklyActivity

describe('getActivityWeekEnds', () => {
  it('ends each week on its Sunday, but the one under way on the day it was read', () => {
    expect(getActivityWeekEnds({ ...ACTIVITY, lastDay: '2026-03-12' })).toEqual(
      ['2026-03-01', '2026-03-08', '2026-03-12']
    )
  })
})

describe('getWeekReachingCommits', () => {
  it('finds the week the running total reaches the count', () => {
    // 3, then 43 by the second week.
    expect(getWeekReachingCommits(ACTIVITY, 15)).toBe('2026-03-02')
  })

  it('starts on the first week for a repo with fewer commits in all', () => {
    expect(getWeekReachingCommits(ACTIVITY, 100)).toBe('2026-02-23')
  })
})

describe('describeWeeklyCommits', () => {
  it('names the first month and the week with the most commits', () => {
    expect(describeWeeklyCommits(ACTIVITY)).toBe(
      'Weekly commits since Feb 2026, peaking at 40 in the week of Mar 2, 2026'
    )
  })
})
