import { useId, useRef, useState } from 'react'
import { useGesture } from '@use-gesture/react'
import { uniq } from 'es-toolkit'

import { Icon } from '@/components/primitives/Icon'
import type { Release } from '@/generated/package-downloads'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import type { GlyphName } from '@/lib/icons'
import { cn } from '@/utils'
import {
  type DaySpan,
  formatDay,
  formatLatestVersion,
  getWheelZoomFactor,
} from './lib/weeks'

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
const DAY_MS = 24 * 60 * 60 * 1000

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

// The readout's summary is quieter than a hovered period's total, which leads.
const READOUT_CLASSES = {
  SUMMARY: 'text-ink-muted',
  PERIOD: 'text-ink',
} as const

export type RunningTotalChartProps = {
  /** The ISO date counting starts on, the first period's first day */
  firstDay: string
  /** The ISO date each period ends on, oldest first; two or more */
  periodEnds: string[]
  /**
   * The ISO dates its width runs from and to, which charts shown together
   * share, so a date sits at the same place on each.
   *
   * Defaults to its own periods'. A start after the first day leaves out the
   * periods before it, and the line starts at the total counted by then.
   */
  span?: DaySpan
  /** What one of what it counts is called, like "commit" */
  noun: string
  /** Its count in each period, one per entry of `periodEnds` */
  counts: number[]
  /** What was counted before `firstDay`, which the running total starts from; 0 by default */
  startTotal?: number
  tone: ChartTone
  /** The glyph in front of the caption, the same as the count's own */
  icon?: GlyphName
  /** What the readout says while no period is hovered */
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
 * Counts per period, like a week or a day, as a running total, on a small
 * shaded line chart that ends at the total, written beside it.
 *
 * It's captioned in its top-left corner, behind the count's glyph, with a
 * summary, or the total through the period under the pointer. A release gets
 * a grey line on its day, which names its latest version while hovered. Drawn
 * for sighted pointer users only: pair it with the counts in words for
 * everyone else.
 */
export const RunningTotalChart = ({
  firstDay,
  periodEnds,
  span,
  noun,
  counts,
  startTotal = 0,
  tone,
  icon,
  summary,
  zoomed = false,
  onZoom,
  onPan,
  releases = [],
  'data-testid': testId,
}: RunningTotalChartProps) => {
  const [activePeriod, setActivePeriod] = useState<number>()
  // The release day under the pointer, which it snaps to over a period.
  const [activeRelease, setActiveRelease] = useState<string>()
  const plotRef = useRef<SVGSVGElement>(null)
  // Set while two fingers pinch, so neither picks a period as it moves.
  const pinchingRef = useRef(false)
  // An id is only for the clip path's url(), where colons don't belong.
  const clipId = `plot-${useId().replaceAll(':', '')}`
  const lastIndex = periodEnds.length - 1
  let runningTotal = startTotal
  const totals = counts.map((count) => {
    runningTotal += count
    return runningTotal
  })
  // A running total only grows, so it peaks at the end.
  const total = totals[lastIndex]
  const { start, end } = span ?? { start: firstDay, end: periodEnds[lastIndex] }
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
  const lastX = toX(periodEnds[lastIndex])
  // The line starts on the first day, at what was counted before it, or at a
  // span's later start, at what was counted by then.
  const lineStart = [firstDay, start].sort()[1]
  const startX = toX(lineStart)
  const firstShown = periodEnds.findIndex((periodEnd) => periodEnd >= lineStart)
  const line = `M${startX},${toY(totals[firstShown - 1] ?? startTotal)}${totals
    .map((count, index) => [count, periodEnds[index]] as const)
    .slice(firstShown)
    .map(([count, periodEnd]) => `L${toX(periodEnd)},${toY(count)}`)
    .join('')}`
  const releaseDays = uniq(releases.map(({ day }) => day)).filter(
    (day) => day >= start && day <= end
  )
  const activeX =
    activePeriod === undefined ? undefined : toX(periodEnds[activePeriod])
  /** The time at a pointer's `clientX`, kept between where the line starts and the span's end, so it never falls on a period the chart leaves out. */
  const getTimeAt = (clientX: number) => {
    const x = clientX - (plotRef.current?.getBoundingClientRect().left ?? 0)
    return Math.min(
      Math.max(
        startTime + ((x - INSET) / (PLOT_RIGHT - INSET)) * spanTime,
        Date.parse(lineStart)
      ),
      Date.parse(end)
    )
  }
  // How much time one pixel across the plot covers.
  const msPerPx = spanTime / (PLOT_RIGHT - INSET)
  useGesture(
    {
      onWheel: ({ event, delta: [dx, dy] }) => {
        // A trackpad's pinch arrives as a wheel with ctrl held, for onPinch.
        if (!onZoom || event.ctrlKey) {
          return
        }
        // Zooms or pans rather than scrolling the page beneath the tooltip.
        event.preventDefault()
        // A sideways scroll, like a trackpad's, pans.
        if (Math.abs(dx) > Math.abs(dy)) {
          onPan?.(dx * msPerPx)
        } else {
          onZoom(getTimeAt(event.clientX), getWheelZoomFactor(dy))
        }
      },
      // A trackpad's pinch, in any browser, as well as two fingers'.
      onPinch: ({ event, origin: [x], offset: [scale], first, last, memo }) => {
        event.preventDefault()
        pinchingRef.current = !last
        // The scale and point between the fingers at the event before.
        const previous: { scale: number; x: number } = first
          ? { scale, x }
          : memo
        if (!first && onZoom) {
          onZoom(getTimeAt(x), previous.scale / scale)
          // Moving both fingers together pans, the way a drag does.
          onPan?.((previous.x - x) * msPerPx)
        }
        return { scale, x }
      },
      // A mouse's drag pans; a finger's reads out the periods instead.
      onDrag: ({ event, delta: [dx], pinching }) => {
        if (
          !pinching &&
          event instanceof PointerEvent &&
          event.pointerType === 'mouse'
        ) {
          onPan?.(-dx * msPerPx)
        }
      },
    },
    // Not passive, so it can stop the page from scrolling and zooming.
    { target: plotRef, eventOptions: { passive: false } }
  )
  /**
   * Reads out the release line within a few pixels of the pointer, or else
   * the period the pointer's day falls in, so it never has to land on either.
   */
  const selectPeriod = (event: React.PointerEvent<SVGSVGElement>) => {
    const x =
      event.clientX - (plotRef.current?.getBoundingClientRect().left ?? 0)
    const release = releaseDays.find(
      (day) => Math.abs(toX(day) - x) <= RELEASE_SNAP_PX
    )
    setActiveRelease(release)
    if (release) {
      setActivePeriod(undefined)
      return
    }
    const time = getTimeAt(event.clientX)
    // The first period ending on or after that day, or the last past them all.
    const index = periodEnds.findIndex(
      (periodEnd) => Date.parse(periodEnd) + DAY_MS > time
    )
    setActivePeriod(index === -1 ? lastIndex : index)
  }
  /** What the caption says: the hovered release, or period, or else the summary. */
  const getReadout = () => {
    if (activeRelease) {
      const versions = releases
        .filter(({ day }) => day === activeRelease)
        .map(({ version }) => version)
      return `${formatLatestVersion(versions)} released ${formatDay(activeRelease)}`
    }
    if (activePeriod !== undefined) {
      return `Through ${formatDay(periodEnds[activePeriod])}: ${formatCount(totals[activePeriod], noun)}`
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
          // A finger dragged across it moves through the periods, not the page.
          'touch-none',
          // A mouse drags a zoomed-in chart along.
          PLOT_CURSOR_CLASSES[zoomed && onPan ? 'PANNABLE' : 'FIXED']
        )}
        // A tap picks a period too, which a finger may not move to first.
        onPointerDown={selectPeriod}
        onPointerMove={(event) => {
          if (!pinchingRef.current) {
            selectPeriod(event)
          }
        }}
        // A finger always leaves once lifted, so its period stays read out.
        onPointerLeave={(event) => {
          if (event.pointerType !== 'touch') {
            setActivePeriod(undefined)
            setActiveRelease(undefined)
          }
        }}
        data-testid="running-total-chart-plot">
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
            data-testid="running-total-chart-release"
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
        {periodEnds[lastIndex] <= end && (
          <text
            x={lastX + 6}
            // Centred on the line's end, about a third of the text's height down.
            y={toY(total) + 5}
            className="fill-ink text-sm font-bold"
            data-testid="running-total-chart-total">
            {/* Shortened like the glyphs, since hovering the last period reads it in full. */}
            {formatCompactCount(total)}
          </text>
        )}
        {activePeriod !== undefined && activeX !== undefined && (
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
              cy={toY(totals[activePeriod])}
              r={4}
              strokeWidth={2}
              // A ring in the tooltip's own color, so the dot stands off the line.
              className={cn(TONE_CLASSES[tone].DOT, 'stroke-surface-raised')}
              data-testid="running-total-chart-dot"
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
            activePeriod === undefined && activeRelease === undefined
              ? 'SUMMARY'
              : 'PERIOD'
          ]
        )}
        data-testid="running-total-chart-readout">
        {icon && <Icon name={icon} className="size-[1.1em] shrink-0" />}
        {getReadout()}
      </p>
    </div>
  )
}
