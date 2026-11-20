import { sum } from 'es-toolkit'
import { objectEntries } from 'ts-extras'

import { formatNumber } from '@/lib/format-count'

/** How many minor versions get a bar of their own; the rest share one. */
export const TOP_VERSIONS = 5

/** A bar on the versions chart: one minor version's downloads, or the rest's together. */
export type VersionBar = {
  /** The minor version, like "4.0", or undefined for the rest together */
  version?: string
  /** How many minor versions it counts: 1, or how many the rest are */
  versionCount: number
  downloads: number
  /** Its downloads' share of the package's, from 0 to 1 */
  share: number
}

/**
 * A package's most downloaded minor versions, most first, with the rest
 * together last, as bars, from its downloads by minor version.
 *
 * Ties go to the later version. The rest get a bar together only where
 * they're two or more, so one left over gets its own instead.
 */
export const getVersionBars = (
  versionDownloads: Record<string, number>
): VersionBar[] => {
  const total = sum(Object.values(versionDownloads))
  /** `downloads` counted for `versionCount` versions, as a bar. */
  const toBar = (
    version: string | undefined,
    versionCount: number,
    downloads: number
  ): VersionBar => ({
    version,
    versionCount,
    downloads,
    share: total === 0 ? 0 : downloads / total,
  })
  const ranked = objectEntries(versionDownloads).toSorted(
    ([aVersion, aDownloads], [bVersion, bDownloads]) =>
      bDownloads - aDownloads ||
      bVersion.localeCompare(aVersion, 'en', { numeric: true })
  )
  const top =
    ranked.length === TOP_VERSIONS + 1 ? ranked : ranked.slice(0, TOP_VERSIONS)
  const rest = ranked.slice(top.length)
  return [
    ...top.map(([version, downloads]) => toBar(version, 1, downloads)),
    ...(rest.length > 0
      ? [
          toBar(
            undefined,
            rest.length,
            sum(rest.map(([, downloads]) => downloads))
          ),
        ]
      : []),
  ]
}

/** A bar's name: its minor version, like "v1.2.x", or the rest's count, like "12 other minor versions". */
export const formatVersionBar = ({ version, versionCount }: VersionBar) =>
  version === undefined
    ? `${versionCount} other minor versions`
    : `v${version}.x`

/**
 * The bars in a sentence, like "Most downloaded minor versions: v1.2.x with
 * 1,210, v1.1.x with 800, and 3 other minor versions with 40".
 */
export const describeVersionDownloads = (bars: VersionBar[]) => {
  const parts = bars.map(
    (bar) => `${formatVersionBar(bar)} with ${formatNumber(bar.downloads)}`
  )
  const list =
    parts.length > 2
      ? `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`
      : parts.join(' and ')
  return `Most downloaded minor versions: ${list}`
}
