import type { WeeklyDownloads } from '@/generated/package-downloads'
import type { Registry } from '~/counts'
import { COUNT_ICONS } from './lib/count-icons'
import { getDownloadWeekEnds, REGISTRY_NAMES } from './lib/weekly-downloads'
import { WeeklyChart, type WeeklyChartProps } from './WeeklyChart'

export type DownloadsChartProps = Pick<
  WeeklyChartProps,
  'releases' | 'span'
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
}: DownloadsChartProps) => (
  <WeeklyChart
    firstDay={history.firstDay}
    weekEnds={getDownloadWeekEnds(history)}
    span={span}
    noun="download"
    weekly={history.weekly}
    tone="DOWNLOADS"
    icon={COUNT_ICONS.downloads}
    summary={`${REGISTRY_NAMES[registry]} downloads`}
    releases={releases}
    data-testid="downloads-chart"
  />
)
