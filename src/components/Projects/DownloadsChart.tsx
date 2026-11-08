import type { Registry, WeeklyDownloads } from '@/generated/package-downloads'
import { COUNT_ICONS } from './lib/count-icons'
import { getDownloadWeekEnds, REGISTRY_NAMES } from './lib/weekly-downloads'
import {
  RunningTotalChart,
  type RunningTotalChartProps,
} from './RunningTotalChart'

export type DownloadsChartProps = Pick<
  RunningTotalChartProps,
  'releases' | 'span' | 'zoomed' | 'onZoom' | 'onPan'
> & {
  history: WeeklyDownloads
  /** The registry the history is from, which the readout names */
  registry: Registry
}

/**
 * A package's downloads as a running total, week by week, on a small shaded
 * line chart, reading out the total through the week under the pointer.
 *
 * Pair it with `describeWeeklyDownloads` for screen readers. Needs two weeks
 * or more.
 */
export const DownloadsChart = ({
  history,
  registry,
  releases,
  span,
  zoomed,
  onZoom,
  onPan,
}: DownloadsChartProps) => (
  <RunningTotalChart
    firstDay={history.firstDay}
    periodEnds={getDownloadWeekEnds(history)}
    span={span}
    zoomed={zoomed}
    onZoom={onZoom}
    onPan={onPan}
    noun="download"
    counts={history.weekly}
    tone="DOWNLOADS"
    icon={COUNT_ICONS.downloads}
    summary={`${REGISTRY_NAMES[registry]} downloads`}
    releases={releases}
    data-testid="downloads-chart"
  />
)
