import { formatCount } from '../format-count'

describe('formatCount', () => {
  it('pluralizes the noun for every count but one', () => {
    expect(formatCount(1, 'PR')).toBe('1 PR')
    expect(formatCount(0, 'PR')).toBe('0 PRs')
    expect(formatCount(2, 'PR')).toBe('2 PRs')
  })

  it('writes a count under a thousand in full', () => {
    expect(formatCount(999, 'commit')).toBe('999 commits')
  })

  it('compacts a count of a thousand or more to one decimal place', () => {
    const CASES = [
      [1000, '1K downloads'],
      [1449, '1.4K downloads'],
      // Rounds rather than truncates.
      [2650, '2.7K downloads'],
      // A whole thousand drops its trailing ".0".
      [1960, '2K downloads'],
      [43_649, '43.6K downloads'],
      [1_234_567, '1.2M downloads'],
    ] as const
    for (const [count, expected] of CASES) {
      expect(formatCount(count, 'download'), String(count)).toBe(expected)
    }
  })
})
