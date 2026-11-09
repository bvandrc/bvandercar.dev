import type { WeeklyDownloads } from '@/generated/package-downloads'
import type { WeeklyActivity } from '@/generated/repo-activity'
import type { Registry } from '~/counts'
import { ActivityChart, type ActivityChartProps } from './ActivityChart'
import { DownloadsChart } from './DownloadsChart'

export type ProjectChartsProps = Pick<
  ActivityChartProps,
  'releases' | 'span'
> & {
  activity?: WeeklyActivity
  downloads?: { registry: Registry; history: WeeklyDownloads }
}

/**
 * A project's commits chart, then its package's downloads chart, whichever
 * it has, sharing one span and set of releases.
 *
 * Loaded on its own, the first time a project's counts are hovered, so the
 * charts' code stays out of the page's first load.
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
