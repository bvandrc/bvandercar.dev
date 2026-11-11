import type { ActivityHistory, ActivityKind } from '~/counts'
import { addDays, listDays } from '~/dates'
import { describeWeekly, getRunningTotals, sumWeeks } from './weeks'

/** What each kind of activity is called, as written in a sentence. */
const ACTIVITY_NAMES = {
  commits: 'commits',
  prs: 'PRs',
} as const satisfies Record<ActivityKind, string>

/** The ISO date each of the history's weeks ends on, oldest first: a Sunday, but for the one under way, which ends on its last day. */
export const getActivityWeekEnds = ({ firstDay, lastDay }: ActivityHistory) =>
  listDays(firstDay, lastDay).filter(
    // getUTCDay counts from Sunday, as 0.
    (day) => new Date(day).getUTCDay() === 0 || day === lastDay
  )

/** The history's commits, or merged PRs, in each of its weeks, Monday to Sunday, the first starting on its first day. */
export const getActivityWeeks = (
  history: ActivityHistory,
  kind: ActivityKind
) => sumWeeks(history.firstDay, history[kind], getActivityWeekEnds(history))

/**
 * The ISO date the running total of commits reaches `count`.
 *
 * The first day, for a repo with fewer commits than that in all.
 */
export const getDayReachingCommits = (
  history: ActivityHistory,
  count: number
) => {
  const index = getRunningTotals(history.commits).findIndex(
    (total) => total >= count
  )
  return index === -1 ? history.firstDay : addDays(history.firstDay, index)
}

/** The commits, or merged PRs, in a sentence, like "Weekly commits since Mar 2025, peaking at 40 in the week of Mar 2, 2026". */
export const describeWeeklyActivity = (
  history: ActivityHistory,
  kind: ActivityKind
) =>
  describeWeekly(
    ACTIVITY_NAMES[kind],
    history.firstDay,
    getActivityWeeks(history, kind)
  )
