import type { Registry, WeeklyDownloads } from '@/generated/package-downloads'
import { getDownloadWeekStarts, REGISTRY_NAMES } from './lib/weekly-downloads'
import { WeeklyChart } from './WeeklyChart'

export type DownloadsChartProps = {
  history: WeeklyDownloads
  /** The registry the history is from, which the readout names */
  registry: Registry
}

/**
 * A package's weekly downloads as a small shaded line chart, reading out the
 * week under the pointer.
 *
 * Pair it with `describeWeeklyDownloads` for screen readers. Needs two weeks
 * or more.
 */
export const DownloadsChart = ({ history, registry }: DownloadsChartProps) => (
  <WeeklyChart
    weekStarts={getDownloadWeekStarts(history)}
    series={[{ noun: 'download', weekly: history.weekly, tone: 'FIRST' }]}
    summary={`Weekly ${REGISTRY_NAMES[registry]} downloads, peak ${Math.max(...history.weekly).toLocaleString('en-US')}`}
    data-testid="downloads-chart"
  />
)
