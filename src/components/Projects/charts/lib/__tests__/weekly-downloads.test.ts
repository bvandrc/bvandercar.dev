import type { DownloadHistory } from '~/counts'
import { describeWeeklyDownloads, getDownloadWeeks } from '../weekly-downloads'

// 5, 1,200, then 12 downloads a week ending Mar 24, the first cut short by a
// publish on Mar 6.
const HISTORY = {
  firstDay: '2026-03-06',
  lastDay: '2026-03-24',
  daily: [
    1, 1, 1, 1, 1, 200, 300, 100, 200, 100, 200, 100, 2, 2, 2, 2, 2, 1, 1,
  ],
} satisfies DownloadHistory

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
  it('describes the downloads, named by registry as written in a sentence, peaking in the busiest of its weeks', () => {
    expect(describeWeeklyDownloads(HISTORY, 'pypi')).toMatch(
      /^Weekly PyPI downloads .*, peaking at 1,200 in the week of Mar 11, 2026$/
    )
  })

  it('names no registry for downloads from more than one', () => {
    expect(describeWeeklyDownloads(HISTORY, undefined)).toMatch(
      /^Weekly downloads since /
    )
  })
})
