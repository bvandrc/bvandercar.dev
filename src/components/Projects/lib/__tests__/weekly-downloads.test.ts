import type { DownloadHistory } from '@/generated/package-downloads'
import {
  describeWeeklyDownloads,
  getDownloadWeekEnds,
  getDownloadWeeks,
} from '../weekly-downloads'

// 5, 1,200, then 12 downloads a week ending Mar 24, the first cut short by a
// publish on Mar 6.
const HISTORY = {
  firstDay: '2026-03-06',
  lastDay: '2026-03-24',
  daily: [
    1, 1, 1, 1, 1, 200, 300, 100, 200, 100, 200, 100, 2, 2, 2, 2, 2, 1, 1,
  ],
} satisfies DownloadHistory

describe('getDownloadWeekEnds', () => {
  it('ends each week 7 days apart, the last on the last day', () => {
    expect(getDownloadWeekEnds(HISTORY)).toEqual([
      '2026-03-10',
      '2026-03-17',
      '2026-03-24',
    ])
  })
})

describe('getDownloadWeeks', () => {
  it('sums the days into weeks, the short first one starting on the first day', () => {
    expect(getDownloadWeeks(HISTORY)).toEqual([
      { start: '2026-03-06', end: '2026-03-10', count: 5 },
      { start: '2026-03-11', end: '2026-03-17', count: 1200 },
      { start: '2026-03-18', end: '2026-03-24', count: 12 },
    ])
  })
})

describe('describeWeeklyDownloads', () => {
  it('names the first month and the peak week', () => {
    expect(describeWeeklyDownloads(HISTORY, 'npm')).toBe(
      'Weekly npm downloads since Mar 2026, peaking at 1,200 in the week of Mar 11, 2026'
    )
  })

  it('names the registry as written in a sentence', () => {
    expect(describeWeeklyDownloads(HISTORY, 'pypi')).toMatch(
      /^Weekly PyPI downloads /
    )
  })
})
