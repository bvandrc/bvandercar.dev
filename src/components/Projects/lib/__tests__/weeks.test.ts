import { formatLatestVersion, getPeakWeek } from '../weeks'

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

describe('formatLatestVersion', () => {
  it('names only the latest of several, by their numbers rather than their order', () => {
    // 1.10.0 sorts before 1.9.0 as text.
    expect(formatLatestVersion(['1.9.0', '1.10.0', '1.0.5'])).toBe('v1.10.0')
  })
})
