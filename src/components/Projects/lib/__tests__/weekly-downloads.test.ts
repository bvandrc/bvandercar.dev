import type { WeeklyDownloads } from '@/generated/npm-downloads'
import {
  describeWeeklyDownloads,
  formatDay,
  formatMonth,
  getPeakWeek,
  getWeekStarts,
} from '../weekly-downloads'

// Three weeks ending Mar 24, the first cut short by a publish on Mar 6.
const HISTORY = {
  firstDay: '2026-03-06',
  lastDay: '2026-03-24',
  weekly: [5, 40, 12],
} satisfies WeeklyDownloads

describe('formatMonth', () => {
  it('writes an ISO date as its month and year', () => {
    expect(formatMonth('2026-03-02')).toBe('Mar 2026')
  })
})

describe('formatDay', () => {
  it('writes an ISO date in full', () => {
    expect(formatDay('2026-03-01')).toBe('Mar 1, 2026')
  })
})

describe('getWeekStarts', () => {
  it('starts each week 7 days apart, counting back from the last day', () => {
    expect(getWeekStarts({ ...HISTORY, firstDay: '2026-03-04' })).toEqual([
      '2026-03-04',
      '2026-03-11',
      '2026-03-18',
    ])
  })

  it('starts a short first week on the first day', () => {
    expect(getWeekStarts(HISTORY)).toEqual([
      '2026-03-06',
      '2026-03-11',
      '2026-03-18',
    ])
  })
})

describe('getPeakWeek', () => {
  it('finds the week with the most downloads, and when it starts', () => {
    expect(getPeakWeek(HISTORY)).toEqual({ downloads: 40, start: '2026-03-11' })
  })

  it('takes the earliest of weeks that tie', () => {
    expect(getPeakWeek({ ...HISTORY, weekly: [40, 40, 12] })).toEqual({
      downloads: 40,
      start: '2026-03-06',
    })
  })
})

describe('describeWeeklyDownloads', () => {
  it('names the first month and the peak week', () => {
    expect(describeWeeklyDownloads({ ...HISTORY, weekly: [5, 1200, 12] })).toBe(
      'Weekly npm downloads since Mar 2026, peaking at 1,200 in the week of Mar 11, 2026'
    )
  })
})
