import { getDaysBetween, listDays } from '../dates'

describe('getDaysBetween', () => {
  it('counts the days from one ISO date to another, across month ends', () => {
    expect(getDaysBetween('2026-02-26', '2026-03-05')).toBe(7)
    expect(getDaysBetween('2026-03-05', '2026-02-26')).toBe(-7)
  })
})

describe('listDays', () => {
  it('lists every day from the first through the last', () => {
    expect(listDays('2026-02-27', '2026-03-02')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ])
  })
})
