import { useRef, useState } from 'react'
import { isNotNil } from 'es-toolkit'

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
import { cn } from '@/utils'
import { ActivityChart } from './ActivityChart'
import { DownloadsChart } from './DownloadsChart'
import { describeWeeklyActivity } from './lib/weekly-activity'
import { describeWeeklyDownloads } from './lib/weekly-downloads'

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
 * A repo's counts as glyphs with shortened numbers, in full as alt text and on
 * hover, like "3,120 downloads".
 *
 * Renders nothing for a repo with no counts. The hover also charts the repo's
 * weekly commits and PRs, and an npm or PyPI package's weekly downloads, each
 * once it has more than a week of them, marking the package's releases on both.
 * On a touch screen, which has no hover, a tap opens and closes the tooltip
 * instead, rather than following a link the counts sit in.
 */
export const ProjectCounts = ({ repo, ...packages }: ProjectCountsProps) => {
  const [open, setOpen] = useState(false)
  // Read at pointerdown, before Radix's own handler closes an open tooltip.
  const tapRef = useRef({ isTouch: false, wasOpen: false })
  const counts = REPO_COUNTS[repo]
  if (!counts) {
    return null
  }
  const pkg = getPackage(packages)
  const history = pkg && PACKAGE_DOWNLOADS[pkg.registry][pkg.name]
  // A single week is a point, not a trend.
  const chartedDownloads =
    pkg && history && history.weekly.length > 1
      ? { registry: pkg.registry, history }
      : undefined
  // Marked on both charts.
  const releases = pkg && PACKAGE_RELEASES[pkg.registry][pkg.name]
  // The profile README badge's counts, in its order and with its icons.
  const shown = COUNT_KINDS.flatMap(({ key, icon, noun }) => {
    const count = counts[key]
    return count === undefined ? [] : [{ key, icon, noun, count }]
  })
  const label = shown
    .map(({ count, noun }) => formatCount(count, noun))
    .join(', ')
  const activity = REPO_ACTIVITY[repo]
  // A single week is a point, not a trend.
  const chartedActivity =
    activity && activity.commits.length > 1 ? activity : undefined
  // The charts' history in words, for screen readers.
  const description = [
    label,
    chartedActivity && describeWeeklyActivity(chartedActivity),
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
      onOpenChange={setOpen}
      content={
        chartedActivity || chartedDownloads ? (
          <div className="flex flex-col gap-3">
            {chartedActivity && (
              <ActivityChart activity={chartedActivity} releases={releases} />
            )}
            {chartedDownloads && (
              <DownloadsChart {...chartedDownloads} releases={releases} />
            )}
            <p
              className={cn(
                'font-bold',
                // Set off from the readout above it, which is white on hover too.
                'border-t border-ink-muted/30 pt-2'
              )}>
              {label}
            </p>
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
            setOpen(!tapRef.current.wasOpen)
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
