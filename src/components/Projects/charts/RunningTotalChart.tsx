import { uniq } from 'es-toolkit'

import {
  LineChart,
  type LineChartHover,
  type LineChartProps,
} from '@/components/primitives/LineChart'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { formatDay } from '@/lib/format-date'
import type { Release } from '~/counts'
import { DAY_MS } from '~/dates'
import { useRunningTotalPlot } from './hooks/useRunningTotalPlot'
import type { DaySpan } from './lib/spans'
import { formatLatestVersion } from './lib/weeks'

/** What a chart counts, which picks its color, the same on every chart. */
export type ChartTone = 'COMMITS' | 'PRS' | 'DOWNLOADS'

const TONE_CLASSES = {
  COMMITS: 'text-commits',
  PRS: 'text-prs',
  // Its own color, so the downloads chart never reads as another commits one.
  DOWNLOADS: 'text-cyan-600',
} as const satisfies Record<ChartTone, string>

/** Along x as times: a zoom's anchor is one, and a pan's delta is in milliseconds. */
export type RunningTotalChartProps = Pick<
  LineChartProps,
  'icon' | 'onZoom' | 'onPan'
> & {
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
  /** What the readout says while no period is hovered */
  summary: string
  /** Whether `span` is zoomed in, which lets a mouse drag the chart along */
  zoomed?: boolean
  /** Marked with a grey line on each day there was one, naming its latest version on hover */
  releases?: Release[]
  'data-testid': string
}

/** What a chart of a history takes from the charts shown with it: their releases, span, and zoom. */
export type RunningTotalChartViewProps = Pick<
  RunningTotalChartProps,
  'releases' | 'span' | 'zoomed' | 'onZoom' | 'onPan'
>

/**
 * Daily counts as a running total, on a small shaded line chart that ends at
 * the total, written beside it, with what the stretch in view added below it
 * while zoomed in on a stretch that starts past zero.
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
  const { total, periodTotals, lineStartTotal, domain, range, points } =
    useRunningTotalPlot({ firstDay, daily, periodEnds, span })
  /** The period the day at `time` falls in. */
  const getActivePeriod = (time: number) => {
    // The first period ending on or after that day, or the last past them all.
    const index = periodEnds.findIndex(
      (periodEnd) => Date.parse(periodEnd) + DAY_MS > time
    )
    const period = index === -1 ? periodEnds.length - 1 : index
    // A zoomed-in span can end partway through a week, whose end, where its
    // dot would sit, is out of view, so the period before it reads out instead.
    return Date.parse(periodEnds[period]) > domain.end
      ? Math.max(period - 1, 0)
      : period
  }
  /** The hovered period's last day and total, which the dot marks. */
  const getPeriodPoint = (time: number) => {
    const period = getActivePeriod(time)
    return { x: Date.parse(periodEnds[period]), y: periodTotals[period] }
  }
  /** What the caption says: the hovered release, or period, or else the summary. */
  const renderReadout = (hover: LineChartHover | undefined) => {
    if (!hover) {
      return summary
    }
    const { marker, x } = hover
    if (marker !== undefined) {
      const versions = releases
        .filter(({ day }) => Date.parse(day) === marker)
        .map(({ version }) => version)
      return `${formatLatestVersion(versions)} released ${formatDay(new Date(marker).toISOString())}`
    }
    const period = getActivePeriod(x)
    return `Through ${formatDay(periodEnds[period])}: ${formatCount(periodTotals[period], noun)}`
  }
  return (
    <LineChart
      points={points}
      domain={domain}
      range={range}
      colorClassName={TONE_CLASSES[tone]}
      markers={uniq(releases.map(({ day }) => Date.parse(day)))}
      renderCaption={renderReadout}
      icon={icon}
      getHoverPoint={getPeriodPoint}
      // Shortened like the glyphs, since hovering the last period reads it in full.
      endLabel={formatCompactCount(total)}
      // Zoomed in past zero, what the stretch in view added, so its start can
      // be read too; a full view that starts partway, like the footer's, needs none.
      endNote={
        zoomed && lineStartTotal > 0
          ? `+${formatCompactCount(total - lineStartTotal)}`
          : undefined
      }
      pannable={zoomed}
      onZoom={onZoom}
      onPan={onPan}
      data-testid={testId}
    />
  )
}
