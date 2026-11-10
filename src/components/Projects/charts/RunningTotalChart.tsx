import { useId, useRef } from 'react'
import { clamp, uniq } from 'es-toolkit'

import { Icon } from '@/components/primitives/Icon'
import { cn } from '@/lib/cn'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { formatDay } from '@/lib/format-date'
import type { GlyphName } from '@/lib/icons'
import type { Release } from '~/counts'
import { addDays, DAY_MS, getDaysBetween } from '~/dates'
import { usePlotInput } from './hooks/usePlotInput'
import { getPlotScale, PLOT } from './lib/plot'
import type { DaySpan } from './lib/spans'
import { formatLatestVersion, getRunningTotals } from './lib/weeks'

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
  /** The ISO date counting starts on */
  firstDay: string
  /** Its count on each day from `firstDay` on, oldest first, which the line runs through; two or more */
  daily: number[]
  /** The ISO date each period it reads out ends on, like each week's last day, oldest first: each one of the days counted, the last being the last of them */
  periodEnds: string[]
  /**
   * The ISO dates its width runs from and to, which charts shown together
   * share, so a date sits at the same place on each.
   *
   * Defaults to its own days'. A start after the first day leaves out the
   * days before it, and the line starts at the total counted by then.
   */
  span?: DaySpan
  /** What one of what it counts is called, like "commit" */
  noun: string
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

/** What a chart of a history takes from the charts shown with it: their releases, span, and zoom. */
export type RunningTotalChartViewProps = Pick<
  RunningTotalChartProps,
  'releases' | 'span' | 'zoomed' | 'onZoom' | 'onPan'
>

type PeriodMarkerProps = Pick<RunningTotalChartProps, 'tone'> & {
  /** Where the period's last day falls across the plot */
  x: number
  /** Where its running total falls up the plot */
  y: number
}

/** The hovered period's line down the plot, with a dot where it meets the line. */
const PeriodMarker = ({ x, y, tone }: PeriodMarkerProps) => (
  <>
    <line
      x1={x}
      x2={x}
      y1={PLOT.CAPTION_HEIGHT}
      y2={PLOT.BASELINE}
      className="stroke-ink-muted/50"
    />
    <circle
      cx={x}
      cy={y}
      r={4}
      strokeWidth={2}
      // A ring in the tooltip's own color, so the dot stands off the line.
      className={cn(TONE_CLASSES[tone].DOT, 'stroke-surface-raised')}
      data-testid="running-total-chart-dot"
    />
  </>
)

type ChartReadoutProps = Pick<RunningTotalChartProps, 'icon'> & {
  /** Whether it reads out the summary, rather than what's under the pointer */
  isSummary: boolean
  children: React.ReactNode
}

/** The caption in the chart's top-left corner, behind the count's glyph. */
const ChartReadout = ({ icon, isSummary, children }: ChartReadoutProps) => (
  <p
    className={cn(
      'flex items-center gap-1.5 whitespace-nowrap',
      // Held in the top-left corner, over the strip the line leaves
      // clear, and letting the pointer through to the plot beneath.
      'pointer-events-none absolute top-0 left-0',
      READOUT_CLASSES[isSummary ? 'SUMMARY' : 'PERIOD']
    )}
    data-testid="running-total-chart-readout">
    {icon && <Icon name={icon} className="size-[1.1em] shrink-0" />}
    {children}
  </p>
)

/**
 * Daily counts as a running total, on a small shaded line chart that ends at
 * the total, written beside it.
 *
 * It's captioned in its top-left corner, behind the count's glyph, with a
 * summary, or the total through the period under the pointer, like its week.
 * A release gets a grey line on its day, which names its latest version while
 * hovered. Drawn for sighted pointer users only: pair it with the counts in
 * words for everyone else.
 */
export const RunningTotalChart = ({
  firstDay,
  daily,
  periodEnds,
  span,
  noun,
  tone,
  icon,
  summary,
  zoomed = false,
  onZoom,
  onPan,
  releases = [],
  'data-testid': testId,
}: RunningTotalChartProps) => {
  const plotRef = useRef<SVGSVGElement>(null)
  // An id is only for the clip path's url(), where colons don't belong.
  const clipId = `plot-${useId().replaceAll(':', '')}`
  const days = daily.map((_, index) => addDays(firstDay, index))
  // It counts two days or more, so has a last.
  const lastDay = days.at(-1) ?? firstDay
  const dayTotals = getRunningTotals(daily)
  // A running total only grows, so it peaks at the end.
  const total = dayTotals.at(-1) ?? 0
  const periodTotals = periodEnds.map(
    (periodEnd) => dayTotals[getDaysBetween(firstDay, periodEnd)]
  )
  const shownSpan = span ?? { start: firstDay, end: lastDay }
  const { startTime, endTime, msPerPx, toX, toY, getTimeAtX } = getPlotScale(
    shownSpan,
    total
  )
  const lastX = toX(lastDay)
  // The line starts on the first day, at what was counted before it, or at a
  // span's later start, at what was counted by then.
  const lineStart =
    Date.parse(firstDay) < startTime ? shownSpan.start : firstDay
  const lineStartTime = Date.parse(lineStart)
  const startX = toX(lineStart)
  const firstShown = days.findIndex((day) => Date.parse(day) >= lineStartTime)
  // Through every day, whichever periods it reads out.
  const line = `M${startX},${toY(dayTotals[firstShown - 1] ?? 0)}${dayTotals
    .map((count, index) => [count, days[index]] as const)
    .slice(firstShown)
    .map(([count, day]) => `L${toX(day)},${toY(count)}`)
    .join('')}`
  /** The time at `x` across the plot, kept between where the line starts and the span's end, so it never falls on a period the chart leaves out. */
  const getShownTimeAtX = (x: number) =>
    clamp(getTimeAtX(x), lineStartTime, endTime)
  const releaseDays = uniq(releases.map(({ day }) => day)).filter(
    (day) => Date.parse(day) >= startTime && Date.parse(day) <= endTime
  )
  // Where the pointer is across the plot, rather than the period under it,
  // so a zoom or pan that slides the line beneath a still pointer reads out
  // what it's over now.
  const { pointerX, pointerProps } = usePlotInput(plotRef, {
    getTimeAtX: getShownTimeAtX,
    valuePerPx: msPerPx,
    onZoom,
    onPan,
  })
  // The release line within a few pixels of the pointer, which it snaps to
  // over a period.
  const activeRelease =
    pointerX === undefined
      ? undefined
      : releaseDays.find(
          (day) => Math.abs(toX(day) - pointerX) <= RELEASE_SNAP_PX
        )
  /** The period the pointer's day falls in, unless it's on a release line. */
  const getActivePeriod = () => {
    if (pointerX === undefined || activeRelease) {
      return undefined
    }
    const time = getShownTimeAtX(pointerX)
    // The first period ending on or after that day, or the last past them all.
    const index = periodEnds.findIndex(
      (periodEnd) => Date.parse(periodEnd) + DAY_MS > time
    )
    const period = index === -1 ? periodEnds.length - 1 : index
    // A zoomed-in span can end partway through a week, whose end, where its
    // dot would sit, is out of view, so the period before it reads out instead.
    return Date.parse(periodEnds[period]) > endTime
      ? Math.max(period - 1, 0)
      : period
  }
  const activePeriod = getActivePeriod()
  /** What the caption says: the hovered release, or period, or else the summary. */
  const getReadout = () => {
    if (activeRelease) {
      const versions = releases
        .filter(({ day }) => day === activeRelease)
        .map(({ version }) => version)
      return `${formatLatestVersion(versions)} released ${formatDay(activeRelease)}`
    }
    if (activePeriod !== undefined) {
      return `Through ${formatDay(periodEnds[activePeriod])}: ${formatCount(periodTotals[activePeriod], noun)}`
    }
    return summary
  }
  return (
    <div className="relative" data-testid={testId}>
      <svg
        ref={plotRef}
        aria-hidden
        width={PLOT.WIDTH}
        height={PLOT.HEIGHT}
        viewBox={`0 0 ${PLOT.WIDTH} ${PLOT.HEIGHT}`}
        className={cn(
          'overflow-visible',
          // A finger dragged across it moves through the periods, not the page.
          'touch-none',
          // A mouse drags a zoomed-in chart along.
          PLOT_CURSOR_CLASSES[zoomed && onPan ? 'PANNABLE' : 'FIXED']
        )}
        {...pointerProps}
        data-testid="running-total-chart-plot">
        <defs>
          {/* Crops a zoomed-in line at the plot's edges. */}
          <clipPath id={clipId}>
            <rect width={PLOT.RIGHT + PLOT.INSET} height={PLOT.HEIGHT} />
          </clipPath>
        </defs>
        <line
          x1={PLOT.INSET}
          x2={PLOT.RIGHT}
          y1={PLOT.BASELINE}
          y2={PLOT.BASELINE}
          className="stroke-ink-muted/30"
        />
        {releaseDays.map((day) => (
          <line
            key={day}
            x1={toX(day)}
            x2={toX(day)}
            y1={PLOT.CAPTION_HEIGHT}
            y2={PLOT.BASELINE}
            className={
              RELEASE_LINE_CLASSES[day === activeRelease ? 'ACTIVE' : 'IDLE']
            }
            data-testid="running-total-chart-release"
          />
        ))}
        <path
          d={`${line}L${lastX},${PLOT.BASELINE}L${startX},${PLOT.BASELINE}Z`}
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
          data-testid="running-total-chart-line"
        />
        {/* Only while the line's end is in view, unless zoomed in short of it. */}
        {Date.parse(lastDay) <= endTime && (
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
        {activePeriod !== undefined && (
          <PeriodMarker
            x={toX(periodEnds[activePeriod])}
            y={toY(periodTotals[activePeriod])}
            tone={tone}
          />
        )}
        {/* The hover target: the whole box, not just the thin line. */}
        <rect width={PLOT.WIDTH} height={PLOT.HEIGHT} fill="transparent" />
      </svg>
      <ChartReadout
        icon={icon}
        isSummary={activePeriod === undefined && activeRelease === undefined}>
        {getReadout()}
      </ChartReadout>
    </div>
  )
}
