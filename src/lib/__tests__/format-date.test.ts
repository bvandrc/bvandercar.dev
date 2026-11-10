import { formatDay, formatMonth } from '../format-date'

describe('formatMonth', () => {
  it('writes an ISO date as its short month and year', () => {
    expect(formatMonth('2026-03-02')).toBe('Mar 2026')
  })
})

describe('formatDay', () => {
  it('writes an ISO date as its short month, day, and year', () => {
    expect(formatDay('2026-03-02')).toBe('Mar 2, 2026')
  })

  it('reads the date in UTC, so no time zone shifts it a day', () => {
    // The first and last days of a year, which a zone east or west would move into the next or last year.
    expect(formatDay('2026-01-01')).toBe('Jan 1, 2026')
    expect(formatDay('2026-12-31')).toBe('Dec 31, 2026')
  })
})
