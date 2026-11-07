import { useState } from 'react'
import { clamp } from 'es-toolkit'

import type { Release } from '@/generated/package-downloads'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { cn } from '@/utils'
import { formatDay, formatVersions, getReleaseWeeks } from './lib/weeks'

// As wide as fits a 375px phone screen, with the tooltip's padding and margins.
const WIDTH = 328
const HEIGHT = 112
// Keeps the 2px line and the 8px hover dot inside the box at either end.
const INSET = 5
// The strip along the top the caption sits in, which the line stays below,
// tall enough that the total beside the line's end clears the caption too.
const CAPTION_HEIGHT = 30
// Where the highest total is drawn.
const PLOT_TOP = CAPTION_HEIGHT + INSET
// Room on the right for the total, written beside the line's end, as short as
// the glyphs write it, like "70.3K".
const TOTAL_WIDTH = 46
// Where the last week is drawn.
const PLOT_RIGHT = WIDTH - TOTAL_WIDTH

/** What a chart counts, which picks its color, the same on every chart. */
export type ChartTone = 'COMMITS' | 'DOWNLOADS'

const TONE_CLASSES = {
  COMMITS: {
    LINE: 'stroke-commits',
    AREA: 'fill-commits/10',
    DOT: 'fill-commits',
  },
  // Its own color, so the downloads chart never reads as another commits one.
  DOWNLOADS: {
    LINE: 'stroke-cyan-600',
    AREA: 'fill-cyan-600/10',
    DOT: 'fill-cyan-600',
  },
} as const satisfies Record<ChartTone, Record<string, string>>

// The readout's summary is quieter than a hovered week's total, which leads.
const READOUT_CLASSES = {
  SUMMARY: 'text-ink-muted',
  WEEK: 'text-ink',
} as const

export type WeeklyChartProps = {
  /** The ISO date each week ends on, oldest first; two or more */
  weekEnds: string[]
  /** What one of what it counts is called, like "commit" */
  noun: string
  /** Its count in each week, one per entry of `weekEnds` */
  weekly: number[]
  tone: ChartTone
  /** What the readout says while no week is hovered */
  summary: string
  /** Marked with a grey line on each week that had one, naming its versions on hover */
  releases?: Release[]
  'data-testid': string
}

/**
 * Weekly counts as a running total, on a small shaded line chart that ends
 * at the total, written beside it.
 *
 * It's captioned in its top-left corner with a summary, or the total through
 * the week under the pointer. A week with releases gets a grey line, and its
 * versions show while it's hovered. Drawn for sighted pointer users only: pair
 * it with the counts in words for everyone else.
 */
export const WeeklyChart = ({
  weekEnds,
  noun,
  weekly,
  tone,
  summary,
  releases = [],
  'data-testid': testId,
}: WeeklyChartProps) => {
  const [activeWeek, setActiveWeek] = useState<number>()
  const lastIndex = weekEnds.length - 1
  let runningTotal = 0
  const totals = weekly.map((count) => {
    runningTotal += count
    return runningTotal
  })
  // A running total only grows, so it peaks at the end.
  const total = totals[lastIndex]
  const toX = (index: number) =>
    INSET + (index / lastIndex) * (PLOT_RIGHT - INSET)
  // A total of zero stays on the baseline rather than dividing by zero.
  const toY = (count: number) =>
    HEIGHT - INSET - (count / (total || 1)) * (HEIGHT - INSET - PLOT_TOP)
  const line = totals
    .map((count, index) => `${index ? 'L' : 'M'}${toX(index)},${toY(count)}`)
    .join('')
  const releaseWeeks = getReleaseWeeks(releases, weekEnds)
  const activeVersions =
    activeWeek === undefined ? undefined : releaseWeeks.get(activeWeek)
  // A label in the right half sits left of its line, so it stays in the box.
  const labelOnLeft = activeWeek !== undefined && activeWeek > lastIndex / 2
  /** Reads out the week nearest the pointer, so it never has to land on the line. */
  const selectWeek = (event: React.PointerEvent<SVGSVGElement>) => {
    const x = event.clientX - event.currentTarget.getBoundingClientRect().left
    const index = Math.round(((x - INSET) / (PLOT_RIGHT - INSET)) * lastIndex)
    setActiveWeek(clamp(index, 0, lastIndex))
  }
  return (
    <div className="relative" data-testid={testId}>
      <svg
        aria-hidden
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={cn(
          'overflow-visible',
          // A finger dragged across it moves through the weeks, not the page.
          'touch-none'
        )}
        // A tap picks a week too, which a finger may not move to first.
        onPointerDown={selectWeek}
        onPointerMove={selectWeek}
        // A finger always leaves once lifted, so its week stays read out.
        onPointerLeave={(event) => {
          if (event.pointerType !== 'touch') {
            setActiveWeek(undefined)
          }
        }}
        data-testid="weekly-chart-plot">
        <line
          x1={INSET}
          x2={PLOT_RIGHT}
          y1={HEIGHT - INSET}
          y2={HEIGHT - INSET}
          className="stroke-ink-muted/30"
        />
        {[...releaseWeeks.keys()].map((index) => (
          <line
            key={index}
            x1={toX(index)}
            x2={toX(index)}
            y1={CAPTION_HEIGHT}
            y2={HEIGHT - INSET}
            className="stroke-ink-muted/30"
            data-testid="weekly-chart-release"
          />
        ))}
        <path
          d={`${line}L${toX(lastIndex)},${HEIGHT - INSET}L${toX(0)},${HEIGHT - INSET}Z`}
          className={TONE_CLASSES[tone].AREA}
        />
        <path
          d={line}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          className={TONE_CLASSES[tone].LINE}
        />
        <text
          x={PLOT_RIGHT + 6}
          // Centred on the line's end, about a third of the text's height down.
          y={toY(total) + 5}
          className="fill-ink text-sm font-bold"
          data-testid="weekly-chart-total">
          {/* Shortened like the glyphs, since hovering the last week reads it in full. */}
          {formatCompactCount(total)}
        </text>
        {activeWeek !== undefined && (
          <>
            <line
              x1={toX(activeWeek)}
              x2={toX(activeWeek)}
              y1={CAPTION_HEIGHT}
              y2={HEIGHT - INSET}
              className="stroke-ink-muted/50"
            />
            <circle
              cx={toX(activeWeek)}
              cy={toY(totals[activeWeek])}
              r={4}
              strokeWidth={2}
              // A ring in the tooltip's own color, so the dot stands off the line.
              className={cn(TONE_CLASSES[tone].DOT, 'stroke-surface-raised')}
            />
          </>
        )}
        {activeWeek !== undefined && activeVersions && (
          <text
            x={toX(activeWeek) + (labelOnLeft ? -4 : 4)}
            y={HEIGHT - INSET - 4}
            textAnchor={labelOnLeft ? 'end' : 'start'}
            className={cn(
              'fill-ink text-xs',
              // An outline in the tooltip's color, so it reads over the line.
              'stroke-surface-raised stroke-3 [paint-order:stroke] [stroke-linejoin:round]'
            )}
            data-testid="weekly-chart-release-label">
            {formatVersions(activeVersions)}
          </text>
        )}
        {/* The hover target: the whole box, not just the thin line. */}
        <rect width={WIDTH} height={HEIGHT} fill="transparent" />
      </svg>
      <p
        className={cn(
          'whitespace-nowrap',
          // Held in the top-left corner, over the strip the line leaves
          // clear, and letting the pointer through to the plot beneath.
          'pointer-events-none absolute top-0 left-0',
          READOUT_CLASSES[activeWeek === undefined ? 'SUMMARY' : 'WEEK']
        )}
        data-testid="weekly-chart-readout">
        {activeWeek === undefined
          ? summary
          : `Through ${formatDay(weekEnds[activeWeek])}: ${formatCount(totals[activeWeek], noun)}`}
      </p>
    </div>
  )
}
