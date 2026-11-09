import type { CommitHistory } from '@/generated/repo-activity'
import {
  describeWeeklyCommits,
  getActivityWeekEnds,
  getDayReachingCommits,
} from '../weekly-activity'

// 3, 40, then 12 commits a week from Wednesday, Feb 25, to Sunday, Mar 15.
const HISTORY = {
  firstDay: '2026-02-25',
  lastDay: '2026-03-15',
  commits: [1, 1, 0, 1, 0, 5, 10, 0, 5, 10, 5, 5, 3, 4, 0, 5, 0, 0, 0],
} satisfies CommitHistory

describe('getActivityWeekEnds', () => {
  it('ends each week on its Sunday, but the one under way on the last day', () => {
    expect(getActivityWeekEnds({ ...HISTORY, lastDay: '2026-03-12' })).toEqual([
      '2026-03-01',
      '2026-03-08',
      '2026-03-12',
    ])
  })
})

describe('getDayReachingCommits', () => {
  it('finds the day the running total reaches the count', () => {
    // 3, then 5 and 10 more on Mar 2 and 3.
    expect(getDayReachingCommits(HISTORY, 15)).toBe('2026-03-03')
  })

  it('starts on the first day for a repo with fewer commits in all', () => {
    expect(getDayReachingCommits(HISTORY, 100)).toBe('2026-02-25')
  })
})

describe('describeWeeklyCommits', () => {
  it('names the first month and the week with the most commits', () => {
    expect(describeWeeklyCommits(HISTORY)).toBe(
      'Weekly commits since Feb 2026, peaking at 40 in the week of Mar 2, 2026'
    )
  })
})
