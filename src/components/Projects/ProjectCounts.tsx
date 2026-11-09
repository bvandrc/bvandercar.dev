import { lazy, Suspense } from 'react'
import {
  type UsePressToggleOptions,
  usePressToggle,
} from '@bvandrc/react-toolkit'
import { isNotNil } from 'es-toolkit'
import { objectEntries } from 'ts-extras'

import { Icon } from '@/components/primitives/Icon'
import { Tooltip } from '@/components/primitives/Tooltip'
import { PACKAGE_DOWNLOAD_TOTALS } from '@/generated/package-download-totals'
import {
  PACKAGE_DOWNLOADS,
  PACKAGE_RELEASES,
} from '@/generated/package-downloads'
import { COUNT_KINDS } from '@/generated/profile/content/counts'
import type { Project } from '@/generated/profile/content/projects'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { REPO_ACTIVITY } from '@/generated/repo-activity'
import { REPO_ACTIVITY_TOTALS } from '@/generated/repo-activity-totals'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { type CountsField, PACKAGE_FIELDS } from '~/counts'
import { DAY_MS } from '~/dates'
import {
  describeWeeklyCommits,
  getWeekReachingCommits,
} from './lib/weekly-activity'
import { describeWeeklyDownloads } from './lib/weekly-downloads'
// The type alone, which leaves the charts' code to the lazy import below.
import type { ProjectChartsProps } from './ProjectCharts'

/** Loads the charts' code, which the module system keeps once loaded. */
const loadCharts = () => import('./ProjectCharts')
const ProjectCharts = lazy<React.ComponentType<ProjectChartsProps>>(() =>
  loadCharts().then(
    // React.lazy takes a default export, which the module doesn't have.
    (module) => ({ default: module.ProjectCharts }),
    // A chunk that fails to load, offline say, leaves the tooltip without
    // charts rather than throwing in render.
    () => ({ default: () => null })
  )
)
/** Starts loading the charts ahead of their first render, which handles a failure itself. */
const prefetchCharts = () => {
  loadCharts().catch(() => undefined)
}

// How many commits a repo with no package needs before it gets a chart.
const UNPACKAGED_MIN_COMMITS = 20
// How many commits a repo with no package has made before its chart starts.
const UNPACKAGED_START_COMMITS = 15
// The shortest stretch of dates the charts are drawn over: two weeks.
const MIN_CHART_MS = 14 * DAY_MS

// Charts size the tooltip to themselves, with text to match, where the
// counts in words are a line of text.
const TOOLTIP_CLASSES = {
  CHARTS: 'max-w-none p-3 text-sm',
  WORDS: undefined,
} as const

// A tap stands in for the hover a touch screen lacks; a mouse, which can
// hover, clicks through to the link the counts sit in.
const TOGGLE_OPTIONS = {
  pointerTypes: ['touch'],
} satisfies UsePressToggleOptions

export type ProjectCountsProps = Pick<Project, CountsField>

/** The registry the project publishes a package to, and its name there, if any. */
const getPackage = (packages: Omit<ProjectCountsProps, 'repo'>) => {
  for (const [registry, field] of objectEntries(PACKAGE_FIELDS)) {
    const name = packages[field]
    if (name) {
      return { registry, name }
    }
  }
  return undefined
}

/**
 * A repo's counts as glyphs with shortened numbers, in full as alt text, and
 * on hover where there's nothing to chart, like "3,120 downloads".
 *
 * Renders nothing for a repo with no counts. The hover charts the repo's
 * commits, and an npm or PyPI package's downloads, as running totals, each
 * once it has more than a week of them, marking the package's releases on both,
 * in place of the counts in words.
 * On a touch screen, which has no hover, a tap opens and closes the tooltip
 * instead, rather than following a link the counts sit in.
 */
export const ProjectCounts = ({ repo, ...packages }: ProjectCountsProps) => {
  // Its pointerdown handler reads the state before Radix's own closes an open
  // tooltip, and its click handler cancels the click, which also stops
  // Radix's from closing it again.
  const { isActive, setIsActive, triggerProps } = usePressToggle(TOGGLE_OPTIONS)
  const pkg = getPackage(packages)
  const downloads = pkg && PACKAGE_DOWNLOAD_TOTALS[pkg.registry][pkg.name]
  // Histories, for the charts, written for the same repos and packages as the
  // totals, so each chart ends at the count shown for it.
  const activity = REPO_ACTIVITY[repo]
  const history = pkg && PACKAGE_DOWNLOADS[pkg.registry][pkg.name]
  // This site's own fetches are fresher than the profile's weekly counts, so
  // a count they have wins.
  const counts = {
    ...REPO_COUNTS[repo],
    ...REPO_ACTIVITY_TOTALS[repo],
    ...(downloads !== undefined && { downloads }),
  }
  // The profile README badge's counts, in its order and with its icons.
  const shown = COUNT_KINDS.flatMap(({ key, icon, noun }) => {
    const count = counts[key]
    return count === undefined ? [] : [{ key, icon, noun, count }]
  })
  if (shown.length === 0) {
    return null
  }
  // A single week is a point, not a trend.
  const chartedActivity =
    activity &&
    activity.commits.length > 1 &&
    // A small repo with no package has too little history to chart.
    (pkg ||
      (REPO_ACTIVITY_TOTALS[repo]?.commits ?? 0) >= UNPACKAGED_MIN_COMMITS)
      ? activity
      : undefined
  const chartedDownloads =
    pkg && history && history.weekly.length > 1
      ? { registry: pkg.registry, history }
      : undefined
  // Marked on both charts.
  const releases = pkg && PACKAGE_RELEASES[pkg.registry][pkg.name]
  /** Where the charts start: past a slow start, so it doesn't squeeze the rest into their right edge. */
  const getSpanStart = () => {
    // A package's first publish, rather than the repo's first commit, which
    // can be years before it: its first release, or its first download where
    // its first releases were deleted, which the registry no longer lists.
    const firstPublish = [releases?.[0]?.day, history?.firstDay]
      .filter(isNotNil)
      .sort()[0]
    if (firstPublish) {
      return firstPublish
    }
    // A repo with no package skips its first few commits' trickle.
    if (!pkg && chartedActivity) {
      return getWeekReachingCommits(chartedActivity, UNPACKAGED_START_COMMITS)
    }
    return ownSpans.map(({ start }) => start).sort()[0]
  }
  // Both charts span the same dates, so a release lines up across them.
  const ownSpans = [
    chartedActivity && {
      start: chartedActivity.firstWeek,
      end: chartedActivity.lastDay,
    },
    chartedDownloads && {
      start: chartedDownloads.history.firstDay,
      end: chartedDownloads.history.lastDay,
    },
  ].filter(isNotNil)
  const span = {
    start: getSpanStart(),
    end: ownSpans.map(({ end }) => end).sort()[ownSpans.length - 1],
  }
  const hasCharts =
    Boolean(chartedActivity || chartedDownloads) &&
    // Too short a stretch, like a package released this week, has nothing
    // to chart yet.
    Date.parse(span.end) - Date.parse(span.start) >= MIN_CHART_MS
  const label = shown
    .map(({ count, noun }) => formatCount(count, noun))
    .join(', ')
  // The charts' history in words, for screen readers.
  const description = [
    label,
    // Only for charts that show.
    ...(hasCharts
      ? [
          chartedActivity && describeWeeklyCommits(chartedActivity),
          chartedDownloads &&
            describeWeeklyDownloads(
              chartedDownloads.history,
              chartedDownloads.registry
            ),
        ]
      : []),
  ]
    .filter(isNotNil)
    .join('. ')
  return (
    <Tooltip
      open={isActive}
      onOpenChange={setIsActive}
      content={
        hasCharts ? (
          <Suspense
            fallback={
              // A blank chart's size for each, so the tooltip doesn't jump
              // once they load.
              <div
                className="flex flex-col gap-3"
                data-testid="project-charts-loading">
                {[chartedActivity, chartedDownloads]
                  .filter(isNotNil)
                  .map((_, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: the blanks have no identity of their own.
                    <div key={index} className="h-21 w-82" />
                  ))}
              </div>
            }>
            <ProjectCharts
              activity={chartedActivity}
              downloads={chartedDownloads}
              releases={releases}
              span={span}
            />
          </Suspense>
        ) : (
          label
        )
      }
      aria-label={description === label ? undefined : description}
      className={TOOLTIP_CLASSES[hasCharts ? 'CHARTS' : 'WORDS']}>
      {/* An image, like the profile README's badge, so its name can be the
          full counts rather than the shortened ones it shows. */}
      <span
        role="img"
        aria-label={label}
        className="inline-flex items-center gap-2.5"
        {...triggerProps}
        // Starts loading the charts as the pointer arrives, ahead of the
        // tooltip's open delay, or with a tap.
        onPointerEnter={hasCharts ? prefetchCharts : undefined}
        onPointerDown={(event) => {
          if (hasCharts) {
            prefetchCharts()
          }
          triggerProps.onPointerDown(event)
        }}
        data-testid="project-counts">
        {shown.map(({ key, icon, count }) => (
          <span key={key} className="inline-flex items-center gap-1">
            <Icon name={icon} className="size-[1.1em]" />
            {formatCompactCount(count)}
          </span>
        ))}
      </span>
    </Tooltip>
  )
}
