import { useRef, useState } from 'react'
import { sum } from 'es-toolkit'

import { Icon } from '@/components/primitives/Icon'
import { Tooltip } from '@/components/primitives/Tooltip'
import { PACKAGE_DOWNLOADS } from '@/generated/package-downloads'
import { COUNT_KINDS } from '@/generated/profile/content/counts'
import type { Project } from '@/generated/profile/content/projects'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { REPO_ACTIVITY } from '@/generated/repo-activity'
import { formatCompactCount, formatCount } from '@/lib/format-count'

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
 * Renders nothing for a repo with no counts. On a touch screen, which has no
 * hover, a tap opens and closes the tooltip instead, rather than following a
 * link the counts sit in.
 */
export const ProjectCounts = ({ repo, ...packages }: ProjectCountsProps) => {
  const [open, setOpen] = useState(false)
  // Read at pointerdown, before Radix's own handler closes an open tooltip.
  const tapRef = useRef({ isTouch: false, wasOpen: false })
  const activity = REPO_ACTIVITY[repo]
  const pkg = getPackage(packages)
  const history = pkg && PACKAGE_DOWNLOADS[pkg.registry][pkg.name]
  // This site's own fetches are fresher than the profile's weekly counts, so
  // a count they have wins.
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
  const label = shown
    .map(({ count, noun }) => formatCount(count, noun))
    .join(', ')
  return (
    <Tooltip content={label} open={open} onOpenChange={setOpen}>
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
