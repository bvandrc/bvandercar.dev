/**
 * The day-by-day history both of `pnpm fetch:git-activity`'s sources write:
 * commits and merged pull requests, counted on the day each was made, or
 * merged.
 */

import { countBy } from 'es-toolkit'

import type { ActivityHistory } from '../../shared/counts.ts'
import { earlierDay, isoDate, listDays } from '../../shared/dates.ts'

/** The ISO date `time`, an ISO time, counts on: its own, or `today` for one dated ahead, by a skewed clock, so it lands on a day the history has. */
export const toDay = (time: string, today: string) =>
  earlierDay(isoDate(Date.parse(time)), today)

/** What a history counts: ISO dates, none later than today. */
export type ActivityDays = {
  /** The day of each commit */
  commitDays: string[]
  /** The day each pull request merged */
  prDays: string[]
  /** Days the history starts by, though nothing counts on them, like the day a pull request opened */
  startDays?: string[]
}

/**
 * Commits and pull requests counted on each day from the earliest of their
 * days through `today`.
 *
 * Every one is on a day, so the days sum to how many there are.
 */
export const buildActivityHistory = (
  { commitDays, prDays, startDays = [] }: ActivityDays,
  today: string
): ActivityHistory => {
  const firstDay = [today, ...commitDays, ...prDays, ...startDays].reduce(
    earlierDay
  )
  const days = listDays(firstDay, today)
  /** How many of `dated` fall on each of the history's days. */
  const countDaily = (dated: string[]) => {
    const counts = countBy(dated, (day) => day)
    return days.map((day) => counts[day] ?? 0)
  }
  return {
    firstDay,
    lastDay: today,
    commits: countDaily(commitDays),
    prs: countDaily(prDays),
  }
}
