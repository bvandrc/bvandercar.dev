import { useRef, useState } from 'react'
import { isNotNil } from 'es-toolkit'

import { Icon } from '@/components/primitives/Icon'
import { Tooltip } from '@/components/primitives/Tooltip'
import { PACKAGE_DOWNLOAD_TOTALS } from '@/generated/package-download-totals'
import { COUNT_KINDS } from '@/generated/profile/content/counts'
import type { Project } from '@/generated/profile/content/projects'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { REPO_ACTIVITY_TOTALS } from '@/generated/repo-activity-totals'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import type { ProjectPackage } from './lib/project-charts'
import { type DaySpan, panSpan, zoomSpan } from './lib/weeks'

/** Loads the charts' code, and the histories they chart, which the module system keeps once loaded. */
const loadCharts = () =>
  Promise.all([import('./ProjectCharts'), import('./lib/project-charts')]).then(
    ([{ ProjectCharts }, { getProjectCharts }]) => ({
      ProjectCharts,
      getProjectCharts,
    })
  )
type Charts = Awaited<ReturnType<typeof loadCharts>>
// Kept once loaded, so counts mounted later start with them.
let loadedCharts: Charts | undefined

export type ProjectCountsProps = Pick<
  Project,
  'repo' | 'npmPackage' | 'pypiPackage'
>

/** The registry the project publishes a package to, and its name there, if any. */
const getPackage = ({
  npmPackage,
  pypiPackage,
}: Omit<ProjectCountsProps, 'repo'>): ProjectPackage | undefined => {
  if (npmPackage) {
    return { registry: 'npm', name: npmPackage }
  }
  if (pypiPackage) {
    return { registry: 'pypi', name: pypiPackage }
  }
  return undefined
}

/**
 * A repo's counts as glyphs with shortened numbers, in full as alt text, and
 * on hover where there's nothing to chart, like "3,120 downloads".
 *
 * Renders nothing for a repo with no counts. The hover charts the repo's
 * commits, and an npm or PyPI package's downloads, as running totals,
 * marking the package's releases on both, in place of the counts in words,
 * as `getProjectCharts` decides. The charts, and their data, load the first
 * time the counts are hovered.
 * On a touch screen, which has no hover, a tap opens and closes the tooltip
 * instead, rather than following a link the counts sit in.
 */
export const ProjectCounts = ({ repo, ...packages }: ProjectCountsProps) => {
  const [open, setOpen] = useState(false)
  // Null once they've failed to load, offline say, which leaves the counts
  // in words.
  const [charts, setCharts] = useState<Charts | null | undefined>(loadedCharts)
  // Shared by both charts, so a release stays lined up across them as they zoom.
  const [zoomedSpan, setZoomedSpan] = useState<DaySpan>()
  // Read at pointerdown, before Radix's own handler closes an open tooltip.
  const tapRef = useRef({ isTouch: false, wasOpen: false })
  const activityTotals = REPO_ACTIVITY_TOTALS[repo]
  const pkg = getPackage(packages)
  const downloadTotal = pkg && PACKAGE_DOWNLOAD_TOTALS[pkg.registry][pkg.name]
  // Only what this site fetched a history for can be charted.
  const mayChart = activityTotals !== undefined || downloadTotal !== undefined
  const projectCharts = charts?.getProjectCharts(repo, pkg)
  /** Starts loading the charts, if there may be any, ahead of the tooltip opening. */
  const prefetchCharts = () => {
    if (mayChart && charts === undefined) {
      loadCharts().then(
        (loaded) => {
          loadedCharts = loaded
          setCharts(loaded)
        },
        () => setCharts(null)
      )
    }
  }
  /** Opens or closes the tooltip, loading the charts as it opens, and closing it zoomed back out. */
  const changeOpen = (next: boolean) => {
    setOpen(next)
    if (next) {
      prefetchCharts()
    } else {
      setZoomedSpan(undefined)
    }
  }
  // This site's own fetches are fresher than the profile's weekly counts, and
  // the charts are drawn from them, so a count they have wins, and each chart
  // ends at the count shown for it.
  const counts = {
    ...REPO_COUNTS[repo],
    ...activityTotals,
    ...(downloadTotal !== undefined && { downloads: downloadTotal }),
  }
  // The profile README badge's counts, in its order and with its icons.
  const shown = COUNT_KINDS.flatMap(({ key, icon, noun }) => {
    const count = counts[key]
    return count === undefined ? [] : [{ key, icon, noun, count }]
  })
  if (shown.length === 0) {
    return null
  }
  const isLoading = mayChart && charts === undefined
  const fullSpan = projectCharts?.span
  // Each from the span before, so gestures landing in one frame build on
  // each other rather than all starting from the same one.
  /** Zooms both charts around a time under the pointer, scaling their width by `factor`. */
  const zoom = (anchor: number, factor: number) =>
    setZoomedSpan(
      (previous) =>
        fullSpan && zoomSpan(previous ?? fullSpan, fullSpan, anchor, factor)
    )
  /** Moves both zoomed-in charts `delta` milliseconds later. */
  const pan = (delta: number) =>
    setZoomedSpan((previous) => fullSpan && panSpan(previous, fullSpan, delta))
  const label = shown
    .map(({ count, noun }) => formatCount(count, noun))
    .join(', ')
  // The charts' history in words, for screen readers.
  const description = projectCharts
    ? [label, ...projectCharts.descriptions].join('. ')
    : undefined
  /** The charts, a blank space their size while they load, or else the counts in words. */
  const getContent = () => {
    if (projectCharts && charts) {
      return (
        <charts.ProjectCharts
          activity={projectCharts.activity}
          downloads={projectCharts.downloads}
          releases={projectCharts.releases}
          span={zoomedSpan ?? projectCharts.span}
          zoomed={zoomedSpan !== undefined}
          onZoom={zoom}
          onPan={pan}
        />
      )
    }
    if (isLoading) {
      // A blank chart's size for each that may show, so the tooltip jumps
      // as little as it can once they load.
      return (
        <div
          className="flex flex-col gap-3"
          data-testid="project-charts-loading">
          {[activityTotals, downloadTotal].filter(isNotNil).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the blanks have no identity of their own.
            <div key={index} className="h-21 w-82" />
          ))}
        </div>
      )
    }
    return label
  }
  return (
    <Tooltip
      open={open}
      onOpenChange={changeOpen}
      content={getContent()}
      aria-label={description}
      // Sized to its charts, with text to match, rather than to a line of text.
      className={
        projectCharts || isLoading ? 'max-w-none p-3 text-sm' : undefined
      }>
      {/* An image, like the profile README's badge, so its name can be the
          full counts rather than the shortened ones it shows. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: a tap only stands in for the hover a touch screen lacks; keyboards focus the link around it. */}
      <span
        role="img"
        aria-label={label}
        className="inline-flex items-center gap-2.5"
        // Starts loading the charts as the pointer arrives, ahead of the
        // tooltip's open delay, or with a tap.
        onPointerEnter={prefetchCharts}
        onPointerDown={(event) => {
          prefetchCharts()
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
