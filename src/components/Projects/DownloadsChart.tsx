import { useState } from 'react'
import { clamp } from 'es-toolkit'

import type { Registry, WeeklyDownloads } from '@/generated/package-downloads'
import { formatCount } from '@/lib/format-count'
import {
  formatDay,
  formatMonth,
  getPeakWeek,
  getWeekStarts,
  REGISTRY_NAMES,
} from './lib/weekly-downloads'

const WIDTH = 256
const HEIGHT = 56
// Keeps the 2px line and the 8px hover dot inside the box at either end.
const INSET = 5

// The readout's summary is quieter than a hovered week's value, which leads.
const READOUT_CLASSES = {
  SUMMARY: 'text-ink-muted',
  WEEK: 'text-ink',
} as const

export type DownloadsChartProps = {
  history: WeeklyDownloads
  /** The registry the history is from, which the readout names */
  registry: Registry
}

/**
 * A package's weekly downloads as a small area chart, with its first and last
 * months below and a line reading out the week under the pointer.
 *
 * Drawn for sighted pointer users only: pair it with the history in words,
 * like `describeWeeklyDownloads`, for everyone else. Needs two weeks or more.
 */
export const DownloadsChart = ({ history, registry }: DownloadsChartProps) => {
  const [activeWeek, setActiveWeek] = useState<number>()
  const { weekly } = history
  const weekStarts = getWeekStarts(history)
  const peak = getPeakWeek(history)
  const lastIndex = weekly.length - 1
  const toX = (index: number) =>
    INSET + (index / lastIndex) * (WIDTH - 2 * INSET)
  // A history of all zeros stays on the baseline rather than dividing by zero.
  const toY = (downloads: number) =>
    HEIGHT - INSET - (downloads / (peak.downloads || 1)) * (HEIGHT - 2 * INSET)
  const line = weekly
    .map(
      (downloads, index) =>
        `${index ? 'L' : 'M'}${toX(index)},${toY(downloads)}`
    )
    .join('')
  const area = `${line}L${toX(lastIndex)},${HEIGHT - INSET}L${toX(0)},${HEIGHT - INSET}Z`
  return (
    <div className="flex flex-col gap-1" data-testid="downloads-chart">
      <svg
        aria-hidden
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="overflow-visible"
        // The nearest week to the pointer, so it never has to land on the line.
        onPointerMove={(event) => {
          const x =
            event.clientX - event.currentTarget.getBoundingClientRect().left
          const index = Math.round(
            ((x - INSET) / (WIDTH - 2 * INSET)) * lastIndex
          )
          setActiveWeek(clamp(index, 0, lastIndex))
        }}
        onPointerLeave={() => setActiveWeek(undefined)}
        data-testid="downloads-chart-plot">
        <line
          x1={INSET}
          x2={WIDTH - INSET}
          y1={HEIGHT - INSET}
          y2={HEIGHT - INSET}
          className="stroke-ink-muted/30"
        />
        <path d={area} className="fill-accent/10" />
        <path
          d={line}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="stroke-accent"
        />
        {activeWeek !== undefined && (
          <>
            <line
              x1={toX(activeWeek)}
              x2={toX(activeWeek)}
              y1={0}
              y2={HEIGHT - INSET}
              className="stroke-ink-muted/50"
            />
            <circle
              cx={toX(activeWeek)}
              cy={toY(weekly[activeWeek])}
              r={4}
              strokeWidth={2}
              // A ring in the tooltip's own color, so the dot stands off the line.
              className="fill-accent stroke-surface-raised"
            />
          </>
        )}
        {/* The hover target: the whole box, not just the thin line. */}
        <rect width={WIDTH} height={HEIGHT} fill="transparent" />
      </svg>
      <div className="flex justify-between text-ink-muted">
        <span>{formatMonth(history.firstDay)}</span>
        <span>{formatMonth(history.lastDay)}</span>
      </div>
      <p
        className={
          READOUT_CLASSES[activeWeek === undefined ? 'SUMMARY' : 'WEEK']
        }
        data-testid="downloads-chart-readout">
        {activeWeek === undefined
          ? `Weekly ${REGISTRY_NAMES[registry]} downloads, peak ${peak.downloads.toLocaleString('en-US')}`
          : `Week of ${formatDay(weekStarts[activeWeek])}: ${formatCount(weekly[activeWeek], 'download')}`}
      </p>
    </div>
  )
}
