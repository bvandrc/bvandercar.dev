import { isNotNil } from 'es-toolkit'

import { ACCOUNT_ACTIVITY } from '@/generated/account-activity'
import { PACKAGE_DOWNLOADS } from '@/generated/package-downloads'
import { REPO_ACTIVITY } from '@/generated/repo-activity'
import type { ActivityHistory, DownloadHistory } from '~/counts'
import { earlierDay, getDaysBetween, isoDate, laterDay } from '~/dates'
import type { ProjectPackage } from './project-charts'
import { getSpanMs, MIN_CHART_MS } from './spans'
import { describeWeeklyActivity } from './weekly-activity'
import { describeWeeklyDownloads } from './weekly-downloads'

// The earliest the charts start, past years of a few commits a month that
// would squeeze the rest into their right edge.
const EARLIEST_START = '2025-01-01'
// How far back the charts open zoomed in to, from their last day.
const INITIAL_ZOOM_MONTHS = 12

/** The ISO dates a history counts from and through. */
type HistoryDays = Pick<DownloadHistory, 'firstDay' | 'lastDay'>

/** The days `histories` count between them, from the earliest first day through the latest last one; one or more histories. */
const getCombinedDays = (histories: HistoryDays[]): HistoryDays => ({
  firstDay: histories.map(({ firstDay }) => firstDay).reduce(earlierDay),
  lastDay: histories.map(({ lastDay }) => lastDay).reduce(laterDay),
})

/** The days `histories` count between them, if they're enough to chart: two or more. */
const getChartedDays = (histories: HistoryDays[]) => {
  if (histories.length === 0) {
    return undefined
  }
  const days = getCombinedDays(histories)
  // A single day is a point, not a trend.
  return days.firstDay === days.lastDay ? undefined : days
}

/** Each history's daily counts, read by `getDaily`, added up day by day across `days`, oldest first. */
const sumDaily = <History extends HistoryDays>(
  histories: History[],
  getDaily: (history: History) => number[],
  days: HistoryDays
) => {
  const totals = Array.from(
    { length: getDaysBetween(days.firstDay, days.lastDay) + 1 },
    () => 0
  )
  for (const history of histories) {
    const offset = getDaysBetween(days.firstDay, history.firstDay)
    getDaily(history).forEach((count, index) => {
      totals[offset + index] += count
    })
  }
  return totals
}

/** The repos' commits and merged PRs added up, day by day, if they span enough days to chart. */
const sumActivity = (
  histories: ActivityHistory[]
): ActivityHistory | undefined => {
  const days = getChartedDays(histories)
  if (!days) {
    return undefined
  }
  return {
    ...days,
    commits: sumDaily(histories, ({ commits }) => commits, days),
    prs: sumDaily(histories, ({ prs }) => prs, days),
  }
}

/** The packages' downloads added up, day by day, if they span enough days to chart. */
const sumDownloads = (
  histories: DownloadHistory[]
): DownloadHistory | undefined => {
  const days = getChartedDays(histories)
  if (!days) {
    return undefined
  }
  return { ...days, daily: sumDaily(histories, ({ daily }) => daily, days) }
}

/**
 * What every project's counts chart together: the GitHub account's commits
 * and merged PRs, or else the repos', and the packages' downloads, each added
 * up day by day, the dates they span, and a sentence describing each chart
 * for screen readers.
 *
 * The charts span from the first day any of them counts, or Jan 1, 2025 if
 * that's later, with each line starting at the total counted by then, and
 * no releases marked, which would crowd them. Where they span longer, they
 * open zoomed in on their last year. Undefined for nothing to chart: no
 * history, or a stretch under two weeks.
 */
export const getTotalCharts = (repos: string[], packages: ProjectPackage[]) => {
  // The account's own, where fetched, in every repo it committed to.
  const activity = sumActivity(
    ACCOUNT_ACTIVITY
      ? [ACCOUNT_ACTIVITY]
      : repos.map((repo) => REPO_ACTIVITY[repo]).filter(isNotNil)
  )
  const downloads = sumDownloads(
    packages
      .map(({ registry, name }) => PACKAGE_DOWNLOADS[registry][name])
      .filter(isNotNil)
  )
  const charted = [activity, downloads].filter(isNotNil)
  if (charted.length === 0) {
    return undefined
  }
  const { firstDay, lastDay } = getCombinedDays(charted)
  const span = { start: laterDay(firstDay, EARLIEST_START), end: lastDay }
  if (getSpanMs(span) < MIN_CHART_MS) {
    return undefined
  }
  const zoomStart = new Date(lastDay)
  zoomStart.setUTCMonth(zoomStart.getUTCMonth() - INITIAL_ZOOM_MONTHS)
  const initialStart = isoDate(zoomStart.getTime())
  return {
    activity,
    prs: activity,
    // From more than one registry, so it names none.
    downloads: downloads && { history: downloads },
    releases: undefined,
    span,
    initialSpan:
      initialStart > span.start
        ? { start: initialStart, end: lastDay }
        : undefined,
    descriptions: [
      activity && describeWeeklyActivity(activity, 'commits'),
      activity && describeWeeklyActivity(activity, 'prs'),
      downloads && describeWeeklyDownloads(downloads, undefined),
    ].filter(isNotNil),
  }
}
