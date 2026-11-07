import type { WeeklyActivity } from '@/generated/repo-activity'
import {
  describeWeeklyActivity,
  getActivityWeekStarts,
} from '../weekly-activity'

const ACTIVITY = {
  firstWeek: '2026-02-23',
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

describe('describeWeeklyActivity', () => {
  it('names the first month and the week with the most commits', () => {
    expect(describeWeeklyActivity(ACTIVITY)).toBe(
      'Weekly commits and PRs since Feb 2026, peaking at 40 commits in the week of Mar 2, 2026'
    )
  })
})
