import {
  describeVersionDownloads,
  formatVersionBar,
  getVersionBars,
  type VersionBar,
} from '../version-downloads'

/** `count` minor versions, 1.0 up, each with one download more than the last, from 1. */
const buildVersionDownloads = (count: number) =>
  Object.fromEntries(
    Array.from({ length: count }, (_, index) => [`1.${index}`, index + 1])
  )

describe('getVersionBars', () => {
  it('ranks the five most downloaded, most first, with the rest together last, each with its share', () => {
    expect(getVersionBars(buildVersionDownloads(8))).toEqual([
      { version: '1.7', versionCount: 1, downloads: 8, share: 8 / 36 },
      { version: '1.6', versionCount: 1, downloads: 7, share: 7 / 36 },
      { version: '1.5', versionCount: 1, downloads: 6, share: 6 / 36 },
      { version: '1.4', versionCount: 1, downloads: 5, share: 5 / 36 },
      { version: '1.3', versionCount: 1, downloads: 4, share: 4 / 36 },
      // 1.0 to 1.2's 1, 2, and 3.
      { version: undefined, versionCount: 3, downloads: 6, share: 6 / 36 },
    ] satisfies VersionBar[])
  })

  it('gives one version left over a bar of its own, rather than the rest one of one', () => {
    const bars = getVersionBars(buildVersionDownloads(6))

    expect(bars.map(({ version }) => version)).toEqual([
      '1.5',
      '1.4',
      '1.3',
      '1.2',
      '1.1',
      '1.0',
    ])
  })

  it('ranks a tie by version, the later first, by its numbers rather than as text', () => {
    // 1.10 sorts before 1.9 as text.
    const bars = getVersionBars({ '1.9': 5, '1.10': 5 })

    expect(bars.map(({ version }) => version)).toEqual(['1.10', '1.9'])
  })

  it('shares none out where nothing was downloaded, rather than dividing by zero', () => {
    expect(getVersionBars({ '1.0': 0, '1.1': 0 })[0].share).toBe(0)
  })
})

describe('formatVersionBar', () => {
  it("names a version's bar by its version, and the rest's by how many they are", () => {
    expect(
      formatVersionBar({
        version: '1.2',
        versionCount: 1,
        downloads: 1,
        share: 1,
      })
    ).toBe('v1.2.x')
    expect(formatVersionBar({ versionCount: 12, downloads: 1, share: 1 })).toBe(
      '12 other minor versions'
    )
  })
})

describe('describeVersionDownloads', () => {
  it('lists every bar with its downloads in full, in order', () => {
    expect(
      describeVersionDownloads(getVersionBars({ '1.0': 7, '1.1': 1210 }))
    ).toBe(
      'Most downloaded minor versions: v1.1.x with 1,210 and v1.0.x with 7'
    )
    expect(
      describeVersionDownloads(getVersionBars(buildVersionDownloads(8)))
    ).toBe(
      'Most downloaded minor versions: v1.7.x with 8, v1.6.x with 7, v1.5.x with 6, v1.4.x with 5, v1.3.x with 4, and 3 other minor versions with 6'
    )
  })
})
