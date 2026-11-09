import type { CommitHistory } from '~/counts'
import { COUNT_ICONS } from './lib/count-icons'
import { getPeriodEnds } from './lib/periods'
import { getActivityWeekEnds } from './lib/weekly-activity'
import {
  RunningTotalChart,
  type RunningTotalChartViewProps,
} from './RunningTotalChart'

export type ActivityChartProps = RunningTotalChartViewProps & {
  activity: CommitHistory
}

/**
 * A repo's commits as a running total, day by day, on a small shaded line
 * chart, reading out the total through the week under the pointer.
 *
 * Across a span under 50 days, it reads out each day instead. Pair it with
 * `describeWeeklyCommits` for screen readers. Needs two days or more.
 */
export const ActivityChart = ({
  activity,
  ...chartProps
}: ActivityChartProps) => (
  <RunningTotalChart
    {...chartProps}
    firstDay={activity.firstDay}
    daily={activity.commits}
    periodEnds={getPeriodEnds(
      getActivityWeekEnds(activity),
      activity,
      chartProps.span
    )}
    noun="commit"
    tone="COMMITS"
    icon={COUNT_ICONS.commits}
    summary="Commits"
    data-testid="activity-chart"
  />
)
