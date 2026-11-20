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
  /** The registry the history is from, which the readout names; leave it out for downloads from more than one */
  registry?: Registry
  /** Each version's downloads in all, by version, which a hovered release reads out; leave it out where the registry doesn't count them */
  versionDownloads?: Record<string, number>
}

/**
 * A package's downloads as a running total, day by day, on a small shaded
 * line chart, reading out the total through the week under the pointer, or a
 * release's version, with its downloads where they're counted.
 *
 * Across a span under 50 days, it reads out each day instead. Pair it with
 * `describeWeeklyDownloads` for screen readers. Needs two days or more.
 */
export const DownloadsChart = ({
  history,
  registry,
  versionDownloads,
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
    releaseCounts={versionDownloads}
    tone="DOWNLOADS"
    icon={COUNT_ICONS.downloads}
    summary={registry ? `${REGISTRY_NAMES[registry]} downloads` : 'Downloads'}
    data-testid="downloads-chart"
  />
)
