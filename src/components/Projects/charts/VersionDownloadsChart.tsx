import { formatCompactCount } from '@/lib/format-count'
import {
  formatVersionBar,
  getVersionBars,
  type VersionBar,
} from './lib/version-downloads'

// A share in whole percents, under 1% where it rounds down to none.
const PERCENT_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
})

/** A bar's share of the downloads, like "17%", or "<1%" for one that rounds to none. */
const formatShare = (share: number) =>
  share > 0 && share < 0.005 ? '<1%' : PERCENT_FORMAT.format(share)

type ShareProps = Pick<VersionBar, 'share'>

/** A row's share of the downloads, in the column down the chart's right side. */
const Share = ({ share }: ShareProps) => (
  <span
    className="justify-self-end text-ink-muted tabular-nums"
    data-testid="version-downloads-chart-share">
    {formatShare(share)}
  </span>
)

export type VersionDownloadsChartProps = {
  /** Each version's downloads in all, by version; two or more */
  versionDownloads: Record<string, number>
}

/**
 * A package's most downloaded versions, most first, as bars, each's downloads
 * at its tip, shortened like the glyphs, then the rest's together, in words,
 * each row's share of them all down the right side.
 *
 * The rest get no bar, since added up they could dwarf the versions'. Drawn
 * for sighted users only: pair it with `describeVersionDownloads` for
 * everyone else.
 */
export const VersionDownloadsChart = ({
  versionDownloads,
}: VersionDownloadsChartProps) => {
  const bars = getVersionBars(versionDownloads)
  const versionBars = bars.filter(({ version }) => version !== undefined)
  const restBar = bars.find(({ version }) => version === undefined)
  // The longest bar spans the room the figures leave; the rest scale to it.
  const longest = Math.max(...versionBars.map(({ downloads }) => downloads), 1)
  return (
    // One grid, so every bar starts after the longest version, and every
    // share lines up on the right.
    <ul
      aria-hidden
      className="grid w-82 grid-cols-[max-content_1fr_max-content] gap-x-2 text-xs"
      data-testid="version-downloads-chart">
      {versionBars.map((bar) => (
        <li
          key={formatVersionBar(bar)}
          className="col-span-3 grid min-h-5 grid-cols-subgrid items-center"
          data-testid="version-downloads-chart-row">
          <span className="text-ink-muted tabular-nums">
            {formatVersionBar(bar)}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              // Grows from a square end at its baseline to a rounded tip.
              className="h-2 min-w-0.5 rounded-r-sm bg-cyan-600"
              // Leaves room at the tip for the figure, at its widest.
              style={{
                width: `calc((100% - 3.25rem) * ${bar.downloads / longest})`,
              }}
              data-testid="version-downloads-chart-bar"
            />
            <span className="text-ink tabular-nums">
              {formatCompactCount(bar.downloads)}
            </span>
          </span>
          <Share share={bar.share} />
        </li>
      ))}
      {restBar && (
        <li
          className="col-span-3 grid min-h-5 grid-cols-subgrid items-center"
          data-testid="version-downloads-chart-row">
          {/* Across the version and bar columns, so its words never widen the first. */}
          <span className="col-span-2 text-ink-muted tabular-nums">
            {`${formatVersionBar(restBar)} · ${formatCompactCount(restBar.downloads)}`}
          </span>
          <Share share={restBar.share} />
        </li>
      )}
    </ul>
  )
}
