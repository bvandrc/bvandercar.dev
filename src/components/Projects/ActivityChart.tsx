import type { WeeklyActivity } from '@/generated/repo-activity'
import { getActivityWeekEnds } from './lib/weekly-activity'
import { WeeklyChart } from './WeeklyChart'

export type ActivityChartProps = {
  activity: WeeklyActivity
}

/**
 * A repo's commits and PRs as running totals, week by week, in two lines on
 * one small chart, with a legend, reading out the totals through the week
 * under the pointer.
 *
 * Pair it with `describeWeeklyActivity` for screen readers. Needs two weeks or
 * more.
 */
export const ActivityChart = ({ activity }: ActivityChartProps) => (
  <WeeklyChart
    weekEnds={getActivityWeekEnds(activity)}
    series={[
      { noun: 'commit', weekly: activity.commits, tone: 'FIRST' },
      { noun: 'PR', weekly: activity.prs, tone: 'SECOND' },
    ]}
    summary="Running total"
    data-testid="activity-chart"
  />
)
