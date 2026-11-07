import type { Registry, WeeklyDownloads } from '@/generated/package-downloads'
import { getDownloadWeekEnds, REGISTRY_NAMES } from './lib/weekly-downloads'
import { WeeklyChart, type WeeklyChartProps } from './WeeklyChart'

export type DownloadsChartProps = Pick<WeeklyChartProps, 'releases'> & {
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
}: DownloadsChartProps) => (
  <WeeklyChart
    weekEnds={getDownloadWeekEnds(history)}
    series={[{ noun: 'download', weekly: history.weekly, tone: 'DOWNLOADS' }]}
    summary={`Running total of ${REGISTRY_NAMES[registry]} downloads`}
    releases={releases}
    data-testid="downloads-chart"
  />
)
