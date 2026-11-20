import { useState } from 'react'

import { Icon } from '@/components/primitives/Icon'
import { cn } from '@/lib/cn'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { COUNT_ICONS } from './lib/count-icons'
import {
  formatVersionBar,
  getVersionBars,
  type VersionBar,
} from './lib/version-downloads'

// The readout's summary is quieter than a hovered bar's figures, which lead.
const READOUT_CLASSES = {
  SUMMARY: 'text-ink-muted',
  BAR: 'text-ink',
} as const

// A share in whole percents, under 1% where it rounds down to none.
const PERCENT_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
})

/** A bar's share of the downloads, like "17%", or "<1%" for one that rounds to none. */
const formatShare = (share: number) =>
  share > 0 && share < 0.005 ? '<1%' : PERCENT_FORMAT.format(share)

export type VersionDownloadsChartProps = {
  /** Each version's downloads in all, by version; two or more */
  versionDownloads: Record<string, number>
}

/**
 * A package's most downloaded versions, most first, as bars, each's downloads
 * at its tip, shortened like the glyphs, then the rest's together, in words.
 *
 * The rest get no bar, since added up they could dwarf the versions'.
 * It's captioned behind the downloads glyph, and reads out a hovered, or
 * tapped, bar's downloads in full, with its share of them all. Drawn for
 * sighted pointer users only: pair it with `describeVersionDownloads` for
 * everyone else.
 */
export const VersionDownloadsChart = ({
  versionDownloads,
}: VersionDownloadsChartProps) => {
  const [activeBar, setActiveBar] = useState<VersionBar>()
  const bars = getVersionBars(versionDownloads)
  const versionBars = bars.filter(({ version }) => version !== undefined)
  const restBar = bars.find(({ version }) => version === undefined)
  // The longest bar spans the room the figures leave; the rest scale to it.
  const longest = Math.max(...versionBars.map(({ downloads }) => downloads), 1)
  /** What makes a row a hover, or tap, target for `bar`. */
  const getRowProps = (bar: VersionBar) => ({
    onPointerEnter: () => setActiveBar(bar),
    onPointerDown: () => setActiveBar(bar),
    // A finger always leaves once lifted, so what it tapped stays read out.
    onPointerLeave: (event: React.PointerEvent) => {
      if (event.pointerType !== 'touch') {
        setActiveBar(undefined)
      }
    },
    'data-testid': 'version-downloads-chart-row',
  })
  return (
    <div aria-hidden className="w-82" data-testid="version-downloads-chart">
      <p
        className={cn(
          'mb-2 flex items-center gap-1.5 whitespace-nowrap',
          READOUT_CLASSES[activeBar ? 'BAR' : 'SUMMARY']
        )}
        data-testid="version-downloads-chart-readout">
        {COUNT_ICONS.downloads && (
          <Icon
            name={COUNT_ICONS.downloads}
            className="size-[1.1em] shrink-0"
          />
        )}
        {activeBar
          ? `${formatVersionBar(activeBar)}: ${formatCount(activeBar.downloads, 'download')}, ${formatShare(activeBar.share)} of all`
          : 'Downloads by version'}
      </p>
      {/* One grid, so every row's bar starts after the longest version. */}
      <ul className="grid grid-cols-[max-content_1fr] gap-x-2">
        {versionBars.map((bar) => (
          <li
            key={formatVersionBar(bar)}
            // Each row is a hover target, taller than its thin bar.
            className="col-span-2 grid min-h-6 grid-cols-subgrid items-center"
            {...getRowProps(bar)}>
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
          </li>
        ))}
      </ul>
      {restBar && (
        <p
          className="flex min-h-6 items-center text-ink-muted tabular-nums"
          {...getRowProps(restBar)}>
          {`${formatVersionBar(restBar)} · ${formatCompactCount(restBar.downloads)}`}
        </p>
      )}
    </div>
  )
}
