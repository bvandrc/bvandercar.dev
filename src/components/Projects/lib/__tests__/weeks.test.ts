import { addDays, formatDay, formatMonth, getPeakWeek } from '../weeks'

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
