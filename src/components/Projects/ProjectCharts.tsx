import type { Registry } from '@/generated/package-download-totals'
import type { DownloadHistory } from '@/generated/package-downloads'
import type { CommitHistory } from '@/generated/repo-activity'
import { ActivityChart, type ActivityChartProps } from './ActivityChart'
import { DownloadsChart } from './DownloadsChart'

export type ProjectChartsProps = Pick<
  ActivityChartProps,
  'releases' | 'span' | 'zoomed' | 'onZoom' | 'onPan'
> & {
  activity?: CommitHistory
  downloads?: { registry: Registry; history: DownloadHistory }
}

/**
 * A project's commits chart, then its package's downloads chart, whichever
 * it has, sharing one span, zoom, and set of releases.
 *
 * Loaded on its own, with the histories it charts, the first time a
 * project's counts are hovered, so neither the charts' code, gestures
 * included, nor their data is in the page's first load.
 */
export const ProjectCharts = ({
  activity,
  downloads,
  ...shared
}: ProjectChartsProps) => (
  <div className="flex flex-col gap-3">
    {activity && <ActivityChart activity={activity} {...shared} />}
    {downloads && <DownloadsChart {...downloads} {...shared} />}
  </div>
)
