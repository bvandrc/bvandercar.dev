import type { WeeklyDownloads } from '@/generated/package-downloads'
import {
  describeWeeklyDownloads,
  getDownloadWeekStarts,
} from '../weekly-downloads'

// Three weeks ending Mar 24, the first cut short by a publish on Mar 6.
const HISTORY = {
  firstDay: '2026-03-06',
  lastDay: '2026-03-24',
  weekly: [5, 40, 12],
} satisfies WeeklyDownloads

describe('getDownloadWeekStarts', () => {
  it('starts each week 7 days apart, counting back from the last day', () => {
    expect(
      getDownloadWeekStarts({ ...HISTORY, firstDay: '2026-03-04' })
    ).toEqual(['2026-03-04', '2026-03-11', '2026-03-18'])
  })

  it('starts a short first week on the first day', () => {
    expect(getDownloadWeekStarts(HISTORY)).toEqual([
      '2026-03-06',
      '2026-03-11',
      '2026-03-18',
    ])
  })
})

describe('describeWeeklyDownloads', () => {
  it('names the first month and the peak week', () => {
    expect(
      describeWeeklyDownloads({ ...HISTORY, weekly: [5, 1200, 12] }, 'npm')
    ).toBe(
      'Weekly npm downloads since Mar 2026, peaking at 1,200 in the week of Mar 11, 2026'
    )
  })

  it('names the registry as written in a sentence', () => {
    expect(describeWeeklyDownloads(HISTORY, 'pypi')).toMatch(
      /^Weekly PyPI downloads /
    )
  })
})
