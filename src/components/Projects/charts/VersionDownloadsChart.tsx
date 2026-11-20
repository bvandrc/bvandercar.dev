import { useState } from 'react'
import { objectKeys } from 'ts-extras'

import { cn } from '@/lib/cn'
import { formatCompactCount } from '@/lib/format-count'
import type { VersionDownloads, VersionPeriod } from '~/counts'
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

// What each period's button says, in the order they sit.
const PERIOD_LABELS = {
  ALL: 'All time',
  LAST_30_DAYS: 'Last 30 days',
  LAST_90_DAYS: 'Last 90 days',
} as const satisfies Record<VersionPeriod, string>

// The chosen period's button stands out from the others.
const PERIOD_BUTTON_CLASSES = {
  CHOSEN: 'bg-ink-muted/20 text-ink',
  IDLE: 'text-ink-muted hover:text-ink',
} as const

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
  /** Each minor version's downloads over each period, two or more in all */
  versionDownloads: VersionDownloads
}

/**
 * A package's most downloaded minor versions, most first, as bars, each's
 * downloads at its tip, shortened like the glyphs, then the rest's together,
 * in words, each row's share of them all down the right side.
 *
 * Buttons above switch between its downloads in all, which it opens on, and
 * over its last 30 or 90 days. The rest get no bar, since added up they
 * could dwarf the versions'. Drawn for sighted pointer users only: pair it
 * with `describeVersionDownloads` for everyone else.
 */
export const VersionDownloadsChart = ({
  versionDownloads,
}: VersionDownloadsChartProps) => {
  const [period, setPeriod] = useState<VersionPeriod>('ALL')
  const bars = getVersionBars(versionDownloads[period])
  const versionBars = bars.filter(({ version }) => version !== undefined)
  const restBar = bars.find(({ version }) => version === undefined)
  // The longest bar spans the room the figures leave; the rest scale to it.
  const longest = Math.max(...versionBars.map(({ downloads }) => downloads), 1)
  return (
    <div
      aria-hidden
      className="flex w-82 flex-col gap-2 text-xs"
      data-testid="version-downloads-chart">
      <div className="flex gap-1">
        {objectKeys(PERIOD_LABELS).map((key) => (
          <button
            key={key}
            type="button"
            // Out of the tab order, like the rest of the chart, which only
            // sighted pointer users see.
            tabIndex={-1}
            onClick={() => setPeriod(key)}
            className={cn(
              'rounded-md px-2 py-0.5',
              PERIOD_BUTTON_CLASSES[key === period ? 'CHOSEN' : 'IDLE']
            )}
            data-testid="version-downloads-chart-period">
            {PERIOD_LABELS[key]}
          </button>
        ))}
      </div>
      {bars.length === 0 ? (
        <p className="text-ink-muted">No downloads in this period</p>
      ) : (
        // One grid, so every bar starts after the longest version, and every
        // share lines up on the right.
        <ul className="grid grid-cols-[max-content_1fr_max-content] gap-x-2">
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
      )}
    </div>
  )
}
