import type { CommitHistory } from '~/counts'
import { addDays, listDays } from '~/dates'
import { formatDay, formatMonth, getPeakWeek, sumWeeks } from './weeks'

/** The ISO date each of the history's weeks ends on, oldest first: a Sunday, but for the one under way, which ends on its last day. */
export const getActivityWeekEnds = ({ firstDay, lastDay }: CommitHistory) =>
  listDays(firstDay, lastDay).filter(
    // getUTCDay counts from Sunday, as 0.
    (day) => new Date(day).getUTCDay() === 0 || day === lastDay
  )

/** The history's commits in each of its weeks, Monday to Sunday, the first starting on its first day. */
export const getActivityWeeks = (history: CommitHistory) =>
  sumWeeks(history.firstDay, history.commits, getActivityWeekEnds(history))

/**
 * The ISO date the running total of commits reaches `count`.
 *
 * The first day, for a repo with fewer commits than that in all.
 */
export const getDayReachingCommits = (
  history: CommitHistory,
  count: number
) => {
  let total = 0
  for (const [index, commits] of history.commits.entries()) {
    total += commits
    if (total >= count) {
      return addDays(history.firstDay, index)
    }
  }
  return history.firstDay
}

/** The commits in a sentence, like "Weekly commits since Mar 2025, peaking at 40 in the week of Mar 2, 2026". */
export const describeWeeklyCommits = (history: CommitHistory) => {
  const peak = getPeakWeek(getActivityWeeks(history))
  return `Weekly commits since ${formatMonth(history.firstDay)}, peaking at ${peak.count.toLocaleString('en-US')} in the week of ${formatDay(peak.start)}`
}
