import { useId, useRef, useState } from 'react'
import { uniq } from 'es-toolkit'

import { Icon } from '@/components/primitives/Icon'
import { useZoomPanGestures } from '@/hooks/useZoomPanGestures'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import type { GlyphName } from '@/lib/icons'
import { cn } from '@/utils'
import type { Release } from '~/counts'
import { DAY_MS } from '~/dates'
import { type DaySpan, formatDay, formatLatestVersion } from './lib/weeks'

// As wide as fits a 375px phone screen, with the tooltip's padding and margins.
const WIDTH = 328
const HEIGHT = 84
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
// Where the last day is drawn.
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

// A grab cursor while there's somewhere to drag the chart to.
const PLOT_CURSOR_CLASSES = {
  FIXED: '',
  PANNABLE: 'cursor-grab active:cursor-grabbing',
} as const

// A hovered release's line stands out from the rest.
const RELEASE_LINE_CLASSES = {
  IDLE: 'stroke-ink-muted/30',
  ACTIVE: 'stroke-ink-muted',
} as const

// How near a release line the pointer snaps to it, in pixels.
const RELEASE_SNAP_PX = 4

// The readout's summary is quieter than a hovered week's total, which leads.
const READOUT_CLASSES = {
  SUMMARY: 'text-ink-muted',
  WEEK: 'text-ink',
} as const

export type WeeklyChartProps = {
  /** The ISO date counting starts on, the first week's first day */
  firstDay: string
  /** The ISO date each week ends on, oldest first; two or more */
  weekEnds: string[]
  /**
   * The ISO dates its width runs from and to, which charts shown together
   * share, so a date sits at the same place on each.
   *
   * Defaults to its own weeks'. A start after the first day leaves out the
   * weeks before it, and the line starts at the total counted by then.
   */
  span?: DaySpan
  /** What one of what it counts is called, like "commit" */
  noun: string
  /** Its count in each week, one per entry of `weekEnds` */
  weekly: number[]
  tone: ChartTone
  /** The glyph in front of the caption, the same as the count's own */
  icon?: GlyphName
  /** What the readout says while no week is hovered */
  summary: string
  /** Whether `span` is zoomed in, which lets a mouse drag the chart along */
  zoomed?: boolean
  /** Called for a wheel turned, or a pinch, over the chart, with the time under it and how much to scale `span`'s width, to zoom around it; without it, the page scrolls and zooms as usual */
  onZoom?: (anchor: number, factor: number) => void
  /** Called for a drag, a sideways scroll, or two fingers moved, over the chart, with how many milliseconds later to move `span` */
  onPan?: (delta: number) => void
  /** Marked with a grey line on each day there was one, naming its latest version on hover */
  releases?: Release[]
  'data-testid': string
}

/**
 * Weekly counts as a running total, on a small shaded line chart that ends
 * at the total, written beside it.
 *
 * It's captioned in its top-left corner, behind the count's glyph, with a
 * summary, or the total through the week under the pointer. A release gets a
 * grey line on its day, which names its latest version while hovered. Drawn for sighted pointer users only: pair
 * it with the counts in words for everyone else.
 */
export const WeeklyChart = ({
  firstDay,
  weekEnds,
  span,
  noun,
  weekly,
  tone,
  icon,
  summary,
  zoomed = false,
  onZoom,
  onPan,
  releases = [],
  'data-testid': testId,
}: WeeklyChartProps) => {
  // Where the pointer is across the plot, rather than the week under it, so
  // a zoom or pan that slides the line beneath a still pointer reads out what
  // it's over now.
  const [pointerX, setPointerX] = useState<number>()
  const plotRef = useRef<SVGSVGElement>(null)
  // An id is only for the clip path's url(), where colons don't belong.
  const clipId = `plot-${useId().replaceAll(':', '')}`
  const lastIndex = weekEnds.length - 1
  let runningTotal = 0
  const totals = weekly.map((count) => {
    runningTotal += count
    return runningTotal
  })
  // A running total only grows, so it peaks at the end.
  const total = totals[lastIndex]
  const { start, end } = span ?? { start: firstDay, end: weekEnds[lastIndex] }
  const startTime = Date.parse(start)
  // A span of one day still has width to draw across.
  const spanTime = Date.parse(end) - startTime || DAY_MS
  /** Where a day falls across the plot. */
  const toX = (day: string) =>
    INSET + ((Date.parse(day) - startTime) / spanTime) * (PLOT_RIGHT - INSET)
  // From zero to the total, zoomed in or not, so a height always means the
  // same count. A total of zero stays on the baseline rather than dividing
  // by zero.
  const toY = (count: number) =>
    HEIGHT - INSET - (count / (total || 1)) * (HEIGHT - INSET - PLOT_TOP)
  const lastX = toX(weekEnds[lastIndex])
  // The line starts on the first day, at nothing counted yet, or at a span's
  // later start, at what was counted by then.
  const lineStart = [firstDay, start].sort()[1]
  const startX = toX(lineStart)
  const firstShown = weekEnds.findIndex((weekEnd) => weekEnd >= lineStart)
  const line = `M${startX},${toY(totals[firstShown - 1] ?? 0)}${totals
    .map((count, index) => [count, weekEnds[index]] as const)
    .slice(firstShown)
    .map(([count, weekEnd]) => `L${toX(weekEnd)},${toY(count)}`)
    .join('')}`
  const releaseDays = uniq(releases.map(({ day }) => day)).filter(
    (day) => day >= start && day <= end
  )
  /** How far across the plot a pointer at `clientX` is. */
  const toPlotX = (clientX: number) =>
    clientX - (plotRef.current?.getBoundingClientRect().left ?? 0)
  /** The time at `x` across the plot, kept between where the line starts and the span's end, so it never falls on a week the chart leaves out. */
  const getTimeAtX = (x: number) =>
    Math.min(
      Math.max(
        startTime + ((x - INSET) / (PLOT_RIGHT - INSET)) * spanTime,
        Date.parse(lineStart)
      ),
      Date.parse(end)
    )
  // The release line within a few pixels of the pointer, which it snaps to
  // over a week.
  const activeRelease =
    pointerX === undefined
      ? undefined
      : releaseDays.find(
          (day) => Math.abs(toX(day) - pointerX) <= RELEASE_SNAP_PX
        )
  /** The week the pointer's day falls in, unless it's on a release line. */
  const getActiveWeek = () => {
    if (pointerX === undefined || activeRelease) {
      return undefined
    }
    const time = getTimeAtX(pointerX)
    // The first week ending on or after that day, or the last past them all.
    const index = weekEnds.findIndex(
      (weekEnd) => Date.parse(weekEnd) + DAY_MS > time
    )
    const week = index === -1 ? lastIndex : index
    // A zoomed-in span can end partway through a week, whose end, where its
    // dot would sit, is out of view, so the week before it reads out instead.
    return weekEnds[week] > end ? Math.max(week - 1, firstShown) : week
  }
  const activeWeek = getActiveWeek()
  const activeX =
    activeWeek === undefined ? undefined : toX(weekEnds[activeWeek])
  // How much time one pixel across the plot covers.
  const msPerPx = spanTime / (PLOT_RIGHT - INSET)
  const pinchingRef = useZoomPanGestures(plotRef, {
    getValueAt: (clientX) => getTimeAtX(toPlotX(clientX)),
    valuePerPx: msPerPx,
    onZoom,
    onPan,
  })
  /** Reads out the release line or week under the pointer, so it never has to land on either. */
  const selectWeek = (event: React.PointerEvent<SVGSVGElement>) =>
    setPointerX(toPlotX(event.clientX))
  /** What the caption says: the hovered release, or week, or else the summary. */
  const getReadout = () => {
    if (activeRelease) {
      const versions = releases
        .filter(({ day }) => day === activeRelease)
        .map(({ version }) => version)
      return `${formatLatestVersion(versions)} released ${formatDay(activeRelease)}`
    }
    if (activeWeek !== undefined) {
      return `Through ${formatDay(weekEnds[activeWeek])}: ${formatCount(totals[activeWeek], noun)}`
    }
    return summary
  }
  return (
    <div className="relative" data-testid={testId}>
      <svg
        ref={plotRef}
        aria-hidden
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={cn(
          'overflow-visible',
          // A finger dragged across it moves through the weeks, not the page.
          'touch-none',
          // A mouse drags a zoomed-in chart along.
          PLOT_CURSOR_CLASSES[zoomed && onPan ? 'PANNABLE' : 'FIXED']
        )}
        // A tap picks a week too, which a finger may not move to first.
        onPointerDown={selectWeek}
        onPointerMove={(event) => {
          if (!pinchingRef.current) {
            selectWeek(event)
          }
        }}
        // A finger always leaves once lifted, so its week stays read out.
        onPointerLeave={(event) => {
          if (event.pointerType !== 'touch') {
            setPointerX(undefined)
          }
        }}
        data-testid="weekly-chart-plot">
        <defs>
          {/* Crops a zoomed-in line at the plot's edges. */}
          <clipPath id={clipId}>
            <rect width={PLOT_RIGHT + INSET} height={HEIGHT} />
          </clipPath>
        </defs>
        <line
          x1={INSET}
          x2={PLOT_RIGHT}
          y1={HEIGHT - INSET}
          y2={HEIGHT - INSET}
          className="stroke-ink-muted/30"
        />
        {releaseDays.map((day) => (
          <line
            key={day}
            x1={toX(day)}
            x2={toX(day)}
            y1={CAPTION_HEIGHT}
            y2={HEIGHT - INSET}
            className={
              RELEASE_LINE_CLASSES[day === activeRelease ? 'ACTIVE' : 'IDLE']
            }
            data-testid="weekly-chart-release"
          />
        ))}
        <path
          d={`${line}L${lastX},${HEIGHT - INSET}L${startX},${HEIGHT - INSET}Z`}
          clipPath={`url(#${clipId})`}
          className={TONE_CLASSES[tone].AREA}
        />
        <path
          d={line}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          clipPath={`url(#${clipId})`}
          className={TONE_CLASSES[tone].LINE}
        />
        {/* Only while the line's end is in view, unless zoomed in short of it. */}
        {weekEnds[lastIndex] <= end && (
          <text
            x={lastX + 6}
            // Centred on the line's end, about a third of the text's height down.
            y={toY(total) + 5}
            className="fill-ink text-sm font-bold"
            data-testid="weekly-chart-total">
            {/* Shortened like the glyphs, since hovering the last week reads it in full. */}
            {formatCompactCount(total)}
          </text>
        )}
        {activeWeek !== undefined && activeX !== undefined && (
          <>
            <line
              x1={activeX}
              x2={activeX}
              y1={CAPTION_HEIGHT}
              y2={HEIGHT - INSET}
              className="stroke-ink-muted/50"
            />
            <circle
              cx={activeX}
              cy={toY(totals[activeWeek])}
              r={4}
              strokeWidth={2}
              // A ring in the tooltip's own color, so the dot stands off the line.
              className={cn(TONE_CLASSES[tone].DOT, 'stroke-surface-raised')}
              data-testid="weekly-chart-dot"
            />
          </>
        )}
        {/* The hover target: the whole box, not just the thin line. */}
        <rect width={WIDTH} height={HEIGHT} fill="transparent" />
      </svg>
      <p
        className={cn(
          'flex items-center gap-1.5 whitespace-nowrap',
          // Held in the top-left corner, over the strip the line leaves
          // clear, and letting the pointer through to the plot beneath.
          'pointer-events-none absolute top-0 left-0',
          READOUT_CLASSES[
            activeWeek === undefined && activeRelease === undefined
              ? 'SUMMARY'
              : 'WEEK'
          ]
        )}
        data-testid="weekly-chart-readout">
        {icon && <Icon name={icon} className="size-[1.1em] shrink-0" />}
        {getReadout()}
      </p>
    </div>
  )
}
