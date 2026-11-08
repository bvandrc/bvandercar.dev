import { isNotNil, sum } from 'es-toolkit'

import type { Registry } from '@/generated/package-download-totals'
import {
  PACKAGE_DOWNLOADS,
  PACKAGE_RELEASES,
} from '@/generated/package-downloads'
import { REPO_ACTIVITY } from '@/generated/repo-activity'
import { describeWeeklyCommits, getDayReachingCommits } from './weekly-activity'
import { describeWeeklyDownloads } from './weekly-downloads'

// How many commits a repo with no package needs before it gets a chart.
const UNPACKAGED_MIN_COMMITS = 20
// How many commits a repo with no package has made before its chart starts.
const UNPACKAGED_START_COMMITS = 15
// The shortest stretch of dates the charts are drawn over: two weeks.
const MIN_CHART_MS = 14 * 24 * 60 * 60 * 1000

/** A package a project publishes: the registry, and its name there. */
export type ProjectPackage = { registry: Registry; name: string }

/**
 * What a project's counts chart: its repo's commits, its package's
 * downloads, or both, with the package's releases, the dates both span, and
 * a sentence describing each for screen readers.
 *
 * Undefined for nothing to chart: no history, a repo with no package and
 * under 20 commits, or a stretch under two weeks, like a package released
 * this week's. A package's charts start at its first release, and a repo
 * with no package's where its commits reach 15, past a slow start that would
 * squeeze the rest into their right edge.
 */
export const getProjectCharts = (
  repo: string,
  pkg: ProjectPackage | undefined
) => {
  const history = REPO_ACTIVITY[repo]
  const downloadHistory = pkg && PACKAGE_DOWNLOADS[pkg.registry][pkg.name]
  // A single day is a point, not a trend.
  const activity =
    history &&
    history.commits.length > 1 &&
    // A small repo with no package has too little history to chart.
    (pkg || sum(history.commits) >= UNPACKAGED_MIN_COMMITS)
      ? history
      : undefined
  const downloads =
    pkg && downloadHistory && downloadHistory.daily.length > 1
      ? { registry: pkg.registry, history: downloadHistory }
      : undefined
  // Marked on both charts.
  const releases = pkg && PACKAGE_RELEASES[pkg.registry][pkg.name]
  // Both charts span the same dates, so a release lines up across them.
  const ownSpans = [
    activity && { start: activity.firstDay, end: activity.lastDay },
    downloads && {
      start: downloads.history.firstDay,
      end: downloads.history.lastDay,
    },
  ].filter(isNotNil)
  /** Where the charts start: a package's first release, the day a repo with no package reaches 15 commits, or else the earliest day either counts. */
  const getSpanStart = () => {
    if (releases?.[0]) {
      return releases[0].day
    }
    if (!pkg && activity) {
      return getDayReachingCommits(activity, UNPACKAGED_START_COMMITS)
    }
    return ownSpans.map(({ start }) => start).sort()[0]
  }
  if (ownSpans.length === 0) {
    return undefined
  }
  const span = {
    start: getSpanStart(),
    end: ownSpans.map(({ end }) => end).sort()[ownSpans.length - 1],
  }
  if (Date.parse(span.end) - Date.parse(span.start) < MIN_CHART_MS) {
    return undefined
  }
  return {
    activity,
    downloads,
    releases,
    span,
    descriptions: [
      activity && describeWeeklyCommits(activity),
      downloads &&
        describeWeeklyDownloads(downloads.history, downloads.registry),
    ].filter(isNotNil),
  }
}
