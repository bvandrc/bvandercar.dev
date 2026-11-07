import type { WeeklyActivity } from '@/generated/repo-activity'
import { addDays, formatDay, formatMonth, getPeakWeek } from './weeks'

/** The ISO date each of the activity's weeks starts on, oldest first. */
export const getActivityWeekStarts = ({ firstWeek, commits }: WeeklyActivity) =>
  commits.map((_, index) => addDays(firstWeek, index * 7))

/** The ISO date each of the activity's weeks ends on, oldest first: a Sunday, but for the one under way, which ends the day it was read. */
export const getActivityWeekEnds = ({
  firstWeek,
  lastDay,
  commits,
}: WeeklyActivity) =>
  commits.map((_, index) => {
    const sunday = addDays(firstWeek, index * 7 + 6)
    return sunday > lastDay ? lastDay : sunday
  })

/** The commits in a sentence, like "Weekly commits since Mar 2025, peaking at 40 in the week of Mar 2, 2026". */
export const describeWeeklyCommits = (activity: WeeklyActivity) => {
  const peak = getPeakWeek(activity.commits, getActivityWeekStarts(activity))
  return `Weekly commits since ${formatMonth(activity.firstWeek)}, peaking at ${peak.count.toLocaleString('en-US')} in the week of ${formatDay(peak.start)}`
}
