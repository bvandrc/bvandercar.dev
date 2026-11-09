import { formatCompactCount, formatCount, formatNumber } from '../format-count'

describe('formatCompactCount', () => {
  it('writes a count under a thousand in full', () => {
    expect(formatCompactCount(999)).toBe('999')
  })

  it('compacts a count of a thousand or more to one decimal place', () => {
    const CASES = [
      [1000, '1K'],
      [1449, '1.4K'],
      // Rounds rather than truncates.
      [2650, '2.7K'],
      // A whole thousand drops its trailing ".0".
      [1960, '2K'],
      [43_649, '43.6K'],
      [1_234_567, '1.2M'],
    ] as const
    for (const [count, expected] of CASES) {
      expect(formatCompactCount(count), String(count)).toBe(expected)
    }
  })
})

describe('formatNumber', () => {
  it('writes a count in full, with separators', () => {
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(70_315)).toBe('70,315')
  })
})

describe('formatCount', () => {
  it('pluralizes the noun for every count but one', () => {
    expect(formatCount(1, 'PR')).toBe('1 PR')
    expect(formatCount(0, 'PR')).toBe('0 PRs')
    expect(formatCount(2, 'PR')).toBe('2 PRs')
  })
})
