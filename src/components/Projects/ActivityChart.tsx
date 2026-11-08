import type { WeeklyActivity } from '@/generated/repo-activity'
import { COUNT_ICONS } from './lib/count-icons'
import { choosePeriods } from './lib/periods'
import { getActivityWeekEnds } from './lib/weekly-activity'
import {
  RunningTotalChart,
  type RunningTotalChartProps,
} from './RunningTotalChart'

export type ActivityChartProps = Pick<
  RunningTotalChartProps,
  'releases' | 'span' | 'zoomed' | 'onZoom' | 'onPan'
> & {
  activity: WeeklyActivity
}

/**
 * A repo's commits as a running total, week by week, on a small shaded line
 * chart, reading out the total through the week under the pointer.
 *
 * Across a span under 50 days, it reads day by day instead.
 *
 * Pair it with `describeWeeklyCommits` for screen readers. Needs two weeks or
 * more.
 */
export const ActivityChart = ({
  activity,
  releases,
  span,
  zoomed,
  onZoom,
  onPan,
}: ActivityChartProps) => (
  <RunningTotalChart
    {...choosePeriods(
      {
        firstDay: activity.firstWeek,
        periodEnds: getActivityWeekEnds(activity),
        counts: activity.commits,
      },
      activity.dailyCommits,
      activity.lastDay,
      span
    )}
    span={span}
    zoomed={zoomed}
    onZoom={onZoom}
    onPan={onPan}
    noun="commit"
    tone="COMMITS"
    icon={COUNT_ICONS.commits}
    summary="Commits"
    releases={releases}
    data-testid="activity-chart"
  />
)
