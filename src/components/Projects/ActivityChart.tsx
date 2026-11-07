import type { WeeklyActivity } from '@/generated/repo-activity'
import { getActivityWeekStarts } from './lib/weekly-activity'
import { WeeklyChart } from './WeeklyChart'

export type ActivityChartProps = {
  activity: WeeklyActivity
}

/**
 * A repo's commits and PRs per week as two lines on one small chart, with a
 * legend, reading out the week under the pointer.
 *
 * Pair it with `describeWeeklyActivity` for screen readers. Needs two weeks or
 * more.
 */
export const ActivityChart = ({ activity }: ActivityChartProps) => (
  <WeeklyChart
    weekStarts={getActivityWeekStarts(activity)}
    series={[
      { noun: 'commit', weekly: activity.commits, tone: 'FIRST' },
      { noun: 'PR', weekly: activity.prs, tone: 'SECOND' },
    ]}
    summary="Weekly"
    data-testid="activity-chart"
  />
)
