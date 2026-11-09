import { useState } from 'react'
import {
  type UsePressToggleOptions,
  usePressToggle,
} from '@bvandrc/react-toolkit'
import { isNotNil } from 'es-toolkit'
import { objectEntries } from 'ts-extras'

import { Icon } from '@/components/primitives/Icon'
import { Tooltip } from '@/components/primitives/Tooltip'
import { PACKAGE_DOWNLOAD_TOTALS } from '@/generated/package-download-totals'
import { COUNT_KINDS } from '@/generated/profile/content/counts'
import type { Project } from '@/generated/profile/content/projects'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { REPO_ACTIVITY_TOTALS } from '@/generated/repo-activity-totals'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { type CountsField, PACKAGE_FIELDS } from '~/counts'
import type { ProjectPackage } from './lib/project-charts'

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

// A tap stands in for the hover a touch screen lacks; a mouse, which can
// hover, clicks through to the link the counts sit in.
const TOGGLE_OPTIONS = {
  pointerTypes: ['touch'],
} satisfies UsePressToggleOptions

export type ProjectCountsProps = Pick<Project, CountsField>

/** The registry the project publishes a package to, and its name there, if any. */
const getPackage = (
  packages: Omit<ProjectCountsProps, 'repo'>
): ProjectPackage | undefined => {
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
 * commits, and an npm or PyPI package's downloads, as running totals,
 * marking the package's releases on both, in place of the counts in words,
 * as `getProjectCharts` decides. The charts, and their data, load the first
 * time the counts are hovered.
 * On a touch screen, which has no hover, a tap opens and closes the tooltip
 * instead, rather than following a link the counts sit in.
 */
export const ProjectCounts = ({ repo, ...packages }: ProjectCountsProps) => {
  // Its pointerdown handler reads the state before Radix's own closes an open
  // tooltip, and its click handler cancels the click, which also stops
  // Radix's from closing it again.
  const { isActive, setIsActive, triggerProps } = usePressToggle(TOGGLE_OPTIONS)
  // Null once they've failed to load, offline say, which leaves the counts
  // in words.
  const [charts, setCharts] = useState<Charts | null | undefined>(loadedCharts)
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
  /** Opens or closes the tooltip, loading the charts as it opens, however it opened. */
  const changeOpen = (next: boolean) => {
    setIsActive(next)
    if (next) {
      prefetchCharts()
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
          span={projectCharts.span}
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
      open={isActive}
      onOpenChange={changeOpen}
      content={getContent()}
      aria-label={description}
      // Sized to its charts, with text to match, rather than to a line of text.
      className={
        projectCharts || isLoading ? 'max-w-none p-3 text-sm' : undefined
      }>
      {/* An image, like the profile README's badge, so its name can be the
          full counts rather than the shortened ones it shows. */}
      <span
        role="img"
        aria-label={label}
        className="inline-flex items-center gap-2.5"
        {...triggerProps}
        // Starts loading the charts as the pointer arrives, ahead of the
        // tooltip's open delay, or with a tap.
        onPointerEnter={prefetchCharts}
        onPointerDown={(event) => {
          prefetchCharts()
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
