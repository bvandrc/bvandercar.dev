import { useRef, useState } from 'react'
import { isNotNil, sum } from 'es-toolkit'

import { Icon } from '@/components/primitives/Icon'
import { Tooltip } from '@/components/primitives/Tooltip'
import {
  PACKAGE_DOWNLOADS,
  PACKAGE_RELEASES,
} from '@/generated/package-downloads'
import { COUNT_KINDS } from '@/generated/profile/content/counts'
import type { Project } from '@/generated/profile/content/projects'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { REPO_ACTIVITY } from '@/generated/repo-activity'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { ActivityChart } from './ActivityChart'
import { DownloadsChart } from './DownloadsChart'
import {
  describeWeeklyCommits,
  getWeekReachingCommits,
} from './lib/weekly-activity'
import { describeWeeklyDownloads } from './lib/weekly-downloads'
import { type DaySpan, zoomSpan } from './lib/weeks'

// How many commits a repo with no package needs before it gets a chart.
const UNPACKAGED_MIN_COMMITS = 20
// How many commits a repo with no package has made before its chart starts.
const UNPACKAGED_START_COMMITS = 15

export type ProjectCountsProps = Pick<
  Project,
  'repo' | 'npmPackage' | 'pypiPackage'
>

/** The registry the project publishes a package to, and its name there, if any. */
const getPackage = ({
  npmPackage,
  pypiPackage,
}: Omit<ProjectCountsProps, 'repo'>) => {
  if (npmPackage) {
    return { registry: 'npm', name: npmPackage } as const
  }
  if (pypiPackage) {
    return { registry: 'pypi', name: pypiPackage } as const
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
  const [open, setOpen] = useState(false)
  // Shared by both charts, so a release stays lined up across them as they zoom.
  const [zoomedSpan, setZoomedSpan] = useState<DaySpan>()
  /** Opens or closes the tooltip, closing it zoomed back out. */
  const changeOpen = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setZoomedSpan(undefined)
    }
  }
  // Read at pointerdown, before Radix's own handler closes an open tooltip.
  const tapRef = useRef({ isTouch: false, wasOpen: false })
  const activity = REPO_ACTIVITY[repo]
  const pkg = getPackage(packages)
  const history = pkg && PACKAGE_DOWNLOADS[pkg.registry][pkg.name]
  // This site's own fetches are fresher than the profile's weekly counts, and
  // the charts are drawn from them, so a count they have wins, and each chart
  // ends at the count shown for it.
  const counts = {
    ...REPO_COUNTS[repo],
    ...(activity && { commits: sum(activity.commits), prs: sum(activity.prs) }),
    ...(history && { downloads: sum(history.weekly) }),
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
    (pkg || sum(activity.commits) >= UNPACKAGED_MIN_COMMITS)
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
    // A package's first release, rather than the repo's first commit, which
    // can be years before it.
    if (releases?.[0]) {
      return releases[0].day
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
  const fullSpan = {
    start: getSpanStart(),
    end: ownSpans.map(({ end }) => end).sort()[ownSpans.length - 1],
  }
  const span = zoomedSpan ?? fullSpan
  /** Zooms both charts around a time under the pointer, scaling their width by `factor`. */
  const zoom = (anchor: number, factor: number) =>
    setZoomedSpan(zoomSpan(span, fullSpan, anchor, factor))
  const label = shown
    .map(({ count, noun }) => formatCount(count, noun))
    .join(', ')
  // The charts' history in words, for screen readers.
  const description = [
    label,
    chartedActivity && describeWeeklyCommits(chartedActivity),
    chartedDownloads &&
      describeWeeklyDownloads(
        chartedDownloads.history,
        chartedDownloads.registry
      ),
  ]
    .filter(isNotNil)
    .join('. ')
  return (
    <Tooltip
      open={open}
      onOpenChange={changeOpen}
      content={
        chartedActivity || chartedDownloads ? (
          <div className="flex flex-col gap-3">
            {chartedActivity && (
              <ActivityChart
                activity={chartedActivity}
                releases={releases}
                span={span}
                zoomed={zoomedSpan !== undefined}
                onZoom={zoom}
              />
            )}
            {chartedDownloads && (
              <DownloadsChart
                {...chartedDownloads}
                releases={releases}
                span={span}
                zoomed={zoomedSpan !== undefined}
                onZoom={zoom}
              />
            )}
          </div>
        ) : (
          label
        )
      }
      aria-label={description === label ? undefined : description}
      // Sized to its charts, with text to match, rather than to a line of text.
      className={
        chartedActivity || chartedDownloads
          ? 'max-w-none p-3 text-sm'
          : undefined
      }>
      {/* An image, like the profile README's badge, so its name can be the
          full counts rather than the shortened ones it shows. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: a tap only stands in for the hover a touch screen lacks; keyboards focus the link around it. */}
      <span
        role="img"
        aria-label={label}
        className="inline-flex items-center gap-2.5"
        onPointerDown={(event) => {
          tapRef.current = {
            isTouch: event.pointerType === 'touch',
            wasOpen: open,
          }
        }}
        onClick={(event) => {
          if (tapRef.current.isTouch) {
            // Also stops Radix's own handler, which would close it again.
            event.preventDefault()
            changeOpen(!tapRef.current.wasOpen)
          }
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
