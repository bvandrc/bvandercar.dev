import type { ActivityHistory, ActivityKind } from '~/counts'
import { COUNT_ICONS } from './lib/count-icons'
import { getPeriodEnds } from './lib/periods'
import { getActivityWeekEnds } from './lib/weekly-activity'
import {
  type ChartTone,
  RunningTotalChart,
  type RunningTotalChartProps,
  type RunningTotalChartViewProps,
} from './RunningTotalChart'

// What each kind of activity's chart counts, and is captioned, colored, and
// found by.
const ACTIVITY_CHARTS = {
  commits: {
    noun: 'commit',
    tone: 'COMMITS',
    summary: 'Commits',
    testId: 'commits-chart',
  },
  prs: { noun: 'PR', tone: 'PRS', summary: 'PRs', testId: 'prs-chart' },
} as const satisfies Record<
  ActivityKind,
  Pick<RunningTotalChartProps, 'noun' | 'summary'> & {
    tone: ChartTone
    testId: string
  }
>

export type ActivityChartProps = RunningTotalChartViewProps & {
  activity: ActivityHistory
  /** Whether it charts the commits or the merged PRs */
  kind: ActivityKind
}

/**
 * A repo's commits, or merged PRs, as a running total, day by day, on a small
 * shaded line chart, reading out the total through the week under the
 * pointer.
 *
 * Across a span under 50 days, it reads out each day instead. Pair it with
 * `describeWeeklyActivity` for screen readers. Needs two days or more.
 */
export const ActivityChart = ({
  activity,
  kind,
  ...chartProps
}: ActivityChartProps) => {
  const { testId, ...chart } = ACTIVITY_CHARTS[kind]
  return (
    <RunningTotalChart
      {...chartProps}
      {...chart}
      firstDay={activity.firstDay}
      daily={activity[kind]}
      periodEnds={getPeriodEnds(
        getActivityWeekEnds(activity),
        activity,
        chartProps.span
      )}
      icon={COUNT_ICONS[kind]}
      data-testid={testId}
    />
  )
}
