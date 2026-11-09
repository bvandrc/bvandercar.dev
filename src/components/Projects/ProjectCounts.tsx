import {
  type UsePressToggleOptions,
  usePressToggle,
} from '@bvandrc/react-toolkit'

import { Icon } from '@/components/primitives/Icon'
import { Tooltip } from '@/components/primitives/Tooltip'
import { PACKAGE_DOWNLOAD_TOTALS } from '@/generated/package-download-totals'
import { COUNT_KINDS } from '@/generated/profile/content/counts'
import type { Project } from '@/generated/profile/content/projects'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { REPO_ACTIVITY_TOTALS } from '@/generated/repo-activity-totals'
import { formatCompactCount, formatCount } from '@/lib/format-count'

// A tap stands in for the hover a touch screen lacks; a mouse, which can
// hover, clicks through to the link the counts sit in.
const TOGGLE_OPTIONS = {
  pointerTypes: ['touch'],
} satisfies UsePressToggleOptions

/** The fields of a project its counts are read from. */
export const COUNTS_FIELDS = [
  'repo',
  'npmPackage',
  'pypiPackage',
] as const satisfies (keyof Project)[]

type CountsField = (typeof COUNTS_FIELDS)[number]

export type ProjectCountsProps = Pick<Project, CountsField>

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
  // Its pointerdown handler reads the state before Radix's own closes an open
  // tooltip, and its click handler cancels the click, which also stops
  // Radix's from closing it again.
  const { isActive, setIsActive, triggerProps } = usePressToggle(TOGGLE_OPTIONS)
  const pkg = getPackage(packages)
  const downloads = pkg && PACKAGE_DOWNLOAD_TOTALS[pkg.registry][pkg.name]
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
  const label = shown
    .map(({ count, noun }) => formatCount(count, noun))
    .join(', ')
  return (
    <Tooltip content={label} open={isActive} onOpenChange={setIsActive}>
      {/* An image, like the profile README's badge, so its name can be the
          full counts rather than the shortened ones it shows. */}
      <span
        role="img"
        aria-label={label}
        className="inline-flex items-center gap-2.5"
        {...triggerProps}
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
