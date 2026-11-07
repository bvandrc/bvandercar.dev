import { useState } from 'react'
import { clamp } from 'es-toolkit'

import { formatCount } from '@/lib/format-count'
import { cn } from '@/utils'
import { formatDay } from './lib/weeks'

const WIDTH = 256
const HEIGHT = 76
// Keeps the 2px lines and the 8px hover dots inside the box at either end.
const INSET = 5
// The strip along the top the caption sits in, which the lines stay below.
const CAPTION_HEIGHT = 18
// Where the highest total is drawn.
const PLOT_TOP = CAPTION_HEIGHT + INSET

/** A series' color, in a fixed order checked to stay apart for colorblind readers. */
export type SeriesTone = 'FIRST' | 'SECOND'

const TONE_CLASSES = {
  FIRST: {
    LINE: 'stroke-cyan-600',
    AREA: 'fill-cyan-600/10',
    DOT: 'fill-cyan-600',
    KEY: 'bg-cyan-600',
  },
  SECOND: {
    LINE: 'stroke-orange-600',
    AREA: 'fill-orange-600/10',
    DOT: 'fill-orange-600',
    KEY: 'bg-orange-600',
  },
} as const satisfies Record<SeriesTone, Record<string, string>>

// The readout's summary is quieter than a hovered week's totals, which lead.
const READOUT_CLASSES = {
  SUMMARY: 'text-ink-muted',
  WEEK: 'text-ink',
} as const

export type ChartSeries = {
  /** What one of the series counts, like "commit" */
  noun: string
  /** Its count in each week, one per entry of `weekEnds` */
  weekly: number[]
  tone: SeriesTone
}

export type WeeklyChartProps = {
  /** The ISO date each week ends on, oldest first; two or more */
  weekEnds: string[]
  /** Drawn in order, so the last is on top; a lone series is shaded beneath */
  series: ChartSeries[]
  /** What the readout says while no week is hovered */
  summary: string
  'data-testid': string
}

/**
 * Weekly counts as running totals, on a small line chart with one shared
 * scale, captioned in its top-left corner with a summary, and a legend for two
 * or more series, or the totals through the week under the pointer.
 *
 * Drawn for sighted pointer users only: pair it with the counts in words for
 * everyone else.
 */
export const WeeklyChart = ({
  weekEnds,
  series,
  summary,
  'data-testid': testId,
}: WeeklyChartProps) => {
  const [activeWeek, setActiveWeek] = useState<number>()
  const lastIndex = weekEnds.length - 1
  const totals = series.map(({ weekly }) => {
    let total = 0
    return weekly.map((count) => {
      total += count
      return total
    })
  })
  // Totals only grow, so the highest is a last one.
  const peak = Math.max(...totals.map((running) => running[lastIndex]))
  const toX = (index: number) =>
    INSET + (index / lastIndex) * (WIDTH - 2 * INSET)
  // Counts of all zeros stay on the baseline rather than dividing by zero.
  const toY = (count: number) =>
    HEIGHT - INSET - (count / (peak || 1)) * (HEIGHT - INSET - PLOT_TOP)
  const toLine = (counts: number[]) =>
    counts
      .map((count, index) => `${index ? 'L' : 'M'}${toX(index)},${toY(count)}`)
      .join('')
  return (
    <div className="relative" data-testid={testId}>
      <svg
        aria-hidden
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="overflow-visible"
        // The nearest week to the pointer, so it never has to land on a line.
        onPointerMove={(event) => {
          const x =
            event.clientX - event.currentTarget.getBoundingClientRect().left
          const index = Math.round(
            ((x - INSET) / (WIDTH - 2 * INSET)) * lastIndex
          )
          setActiveWeek(clamp(index, 0, lastIndex))
        }}
        onPointerLeave={() => setActiveWeek(undefined)}
        data-testid="weekly-chart-plot">
        <line
          x1={INSET}
          x2={WIDTH - INSET}
          y1={HEIGHT - INSET}
          y2={HEIGHT - INSET}
          className="stroke-ink-muted/30"
        />
        {series.length === 1 && (
          <path
            d={`${toLine(totals[0])}L${toX(lastIndex)},${HEIGHT - INSET}L${toX(0)},${HEIGHT - INSET}Z`}
            className={TONE_CLASSES[series[0].tone].AREA}
          />
        )}
        {series.map(({ noun, tone }, index) => (
          <path
            key={noun}
            d={toLine(totals[index])}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className={TONE_CLASSES[tone].LINE}
          />
        ))}
        {activeWeek !== undefined && (
          <>
            <line
              x1={toX(activeWeek)}
              x2={toX(activeWeek)}
              y1={CAPTION_HEIGHT}
              y2={HEIGHT - INSET}
              className="stroke-ink-muted/50"
            />
            {series.map(({ noun, tone }, index) => (
              <circle
                key={noun}
                cx={toX(activeWeek)}
                cy={toY(totals[index][activeWeek])}
                r={4}
                strokeWidth={2}
                // A ring in the tooltip's own color, so a dot stands off the lines.
                className={cn(TONE_CLASSES[tone].DOT, 'stroke-surface-raised')}
              />
            ))}
          </>
        )}
        {/* The hover target: the whole box, not just the thin lines. */}
        <rect width={WIDTH} height={HEIGHT} fill="transparent" />
      </svg>
      <p
        className={cn(
          'flex items-center gap-x-2 whitespace-nowrap',
          // Held in the top-left corner, over the strip the lines leave
          // clear, and letting the pointer through to the plot beneath.
          'pointer-events-none absolute top-0 left-0',
          READOUT_CLASSES[activeWeek === undefined ? 'SUMMARY' : 'WEEK']
        )}
        data-testid="weekly-chart-readout">
        {activeWeek === undefined ? (
          <>
            {summary}
            {series.length > 1 &&
              series.map(({ noun, tone }) => (
                <span key={noun} className="inline-flex items-center gap-1">
                  {/* A short stroke, like the line it names. */}
                  <span
                    className={cn(
                      'h-0.5 w-3 rounded-full',
                      TONE_CLASSES[tone].KEY
                    )}
                  />
                  {`${noun}s`}
                </span>
              ))}
          </>
        ) : (
          `Through ${formatDay(weekEnds[activeWeek])}: ${series
            .map(({ noun }, index) =>
              formatCount(totals[index][activeWeek], noun)
            )
            .join(', ')}`
        )}
      </p>
    </div>
  )
}
