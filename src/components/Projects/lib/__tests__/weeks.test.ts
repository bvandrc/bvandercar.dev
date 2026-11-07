import {
  addDays,
  formatDay,
  formatMonth,
  formatVersions,
  getPeakWeek,
  getReleaseWeeks,
} from '../weeks'

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

describe('addDays', () => {
  it('moves an ISO date forward or back, across month ends', () => {
    expect(addDays('2026-02-26', 7)).toBe('2026-03-05')
    expect(addDays('2026-03-05', -7)).toBe('2026-02-26')
  })
})

describe('getPeakWeek', () => {
  const WEEK_STARTS = ['2026-03-02', '2026-03-09', '2026-03-16']

  it('finds the week with the highest count, and when it starts', () => {
    expect(getPeakWeek([5, 40, 12], WEEK_STARTS)).toEqual({
      count: 40,
      start: '2026-03-09',
    })
  })

  it('takes the earliest of weeks that tie', () => {
    expect(getPeakWeek([40, 40, 12], WEEK_STARTS)).toEqual({
      count: 40,
      start: '2026-03-02',
    })
  })
})

describe('getReleaseWeeks', () => {
  const WEEK_ENDS = ['2026-03-08', '2026-03-15', '2026-03-22']

  it('groups releases by the week they fall in, oldest version first', () => {
    const weeks = getReleaseWeeks(
      [
        { version: '1.1.0', day: '2026-03-15' },
        { version: '1.0.0', day: '2026-03-02' },
        { version: '1.0.1', day: '2026-03-09' },
      ],
      WEEK_ENDS
    )
    expect([...weeks]).toEqual([
      [0, ['1.0.0']],
      // The 9th starts the second week, and the 15th ends it.
      [1, ['1.0.1', '1.1.0']],
    ])
  })

  it('leaves out releases from before the first week or after the last', () => {
    const weeks = getReleaseWeeks(
      [
        { version: '0.9.0', day: '2026-03-01' },
        { version: '2.0.0', day: '2026-03-23' },
      ],
      WEEK_ENDS
    )
    expect(weeks.size).toBe(0)
  })
})

describe('formatVersions', () => {
  it('names a lone version', () => {
    expect(formatVersions(['1.2.0'])).toBe('v1.2.0')
  })

  it('spans several versions from the first to the last', () => {
    expect(formatVersions(['1.0.0', '1.0.1', '1.0.5'])).toBe('v1.0.0–v1.0.5')
  })
})
