import type { WeeklyActivity } from '@/generated/repo-activity'
import { getActivityWeekEnds } from './lib/weekly-activity'
import { WeeklyChart, type WeeklyChartProps } from './WeeklyChart'

export type ActivityChartProps = Pick<WeeklyChartProps, 'releases'> & {
  activity: WeeklyActivity
}

/**
 * A repo's commits as a running total, week by week, on a small shaded line
 * chart, reading out the total through the week under the pointer.
 *
 * Pair it with `describeWeeklyCommits` for screen readers. Needs two weeks or
 * more.
 */
export const ActivityChart = ({ activity, releases }: ActivityChartProps) => (
  <WeeklyChart
    weekEnds={getActivityWeekEnds(activity)}
    noun="commit"
    weekly={activity.commits}
    tone="COMMITS"
    summary="Running total of commits"
    releases={releases}
    data-testid="activity-chart"
  />
)
