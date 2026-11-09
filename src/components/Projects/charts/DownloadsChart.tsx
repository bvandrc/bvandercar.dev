import type { DownloadHistory, Registry } from '~/counts'
import { COUNT_ICONS } from './lib/count-icons'
import { getPeriodEnds } from './lib/periods'
import { getDownloadWeekEnds, REGISTRY_NAMES } from './lib/weekly-downloads'
import {
  RunningTotalChart,
  type RunningTotalChartViewProps,
} from './RunningTotalChart'

export type DownloadsChartProps = RunningTotalChartViewProps & {
  history: DownloadHistory
  /** The registry the history is from, which the readout names */
  registry: Registry
}

/**
 * A package's downloads as a running total, day by day, on a small shaded
 * line chart, reading out the total through the week under the pointer.
 *
 * Across a span under 50 days, it reads out each day instead. Pair it with
 * `describeWeeklyDownloads` for screen readers. Needs two days or more.
 */
export const DownloadsChart = ({
  history,
  registry,
  ...chartProps
}: DownloadsChartProps) => (
  <RunningTotalChart
    {...chartProps}
    firstDay={history.firstDay}
    daily={history.daily}
    periodEnds={getPeriodEnds(
      getDownloadWeekEnds(history),
      history,
      chartProps.span
    )}
    noun="download"
    tone="DOWNLOADS"
    icon={COUNT_ICONS.downloads}
    summary={`${REGISTRY_NAMES[registry]} downloads`}
    data-testid="downloads-chart"
  />
)
