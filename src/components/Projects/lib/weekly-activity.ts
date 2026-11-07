import type { WeeklyActivity } from '@/generated/repo-activity'
import { formatCount } from '@/lib/format-count'
import { addDays, formatDay, formatMonth, getPeakWeek } from './weeks'

/** The ISO date each of the activity's weeks starts on, oldest first. */
export const getActivityWeekStarts = ({ firstWeek, commits }: WeeklyActivity) =>
  commits.map((_, index) => addDays(firstWeek, index * 7))

/** The activity in a sentence, like "Weekly commits and PRs since Mar 2025, peaking at 40 commits in the week of Mar 2, 2026". */
export const describeWeeklyActivity = (activity: WeeklyActivity) => {
  const peak = getPeakWeek(activity.commits, getActivityWeekStarts(activity))
  return `Weekly commits and PRs since ${formatMonth(activity.firstWeek)}, peaking at ${formatCount(peak.count, 'commit')} in the week of ${formatDay(peak.start)}`
}
