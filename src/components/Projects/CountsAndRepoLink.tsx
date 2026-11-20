import { useFocusVisibleOpen } from '@bvandrc/react-toolkit'

import { Icon } from '@/components/primitives/Icon'
import { Link } from '@/components/primitives/Link'
import { Tooltip } from '@/components/primitives/Tooltip'
import type { Project } from '@/generated/profile/content/projects'
import { cn } from '@/lib/cn'
import { getRepoUrl } from '~/github'
import { ProjectCounts, type ProjectCountsProps } from './ProjectCounts'

export type CountsAndRepoLinkProps = Omit<
  ProjectCountsProps,
  'open' | 'onOpenChange' | 'focusable'
> &
  Pick<Project, 'privateRepo'> & {
    /** The `id` of the project's name, which describes the link */
    nameId: string
  }

/**
 * A project's counts, in a link to its GitHub repo, then "repo".
 *
 * Each part shows its own tooltip on hover, and keyboard focus on the link
 * shows the counts' one, charts and all. A private repo would 404 for a
 * visitor, so its counts stand alone, in the link's color, and take that
 * keyboard focus themselves.
 */
export const CountsAndRepoLink = ({
  nameId,
  privateRepo = false,
  ...countsProps
}: CountsAndRepoLinkProps) => {
  const {
    open: countsOpen,
    setOpen: setCountsOpen,
    focusProps,
  } = useFocusVisibleOpen()
  if (privateRepo) {
    return (
      // Lined up as the link would be.
      <span className="inline-flex justify-end text-link-subtle">
        <ProjectCounts {...countsProps} focusable />
      </span>
    )
  }
  return (
    <Link
      // Its name is its counts in full, then "repo", which needs the project
      // beside it. A label naming the project too would no longer contain the
      // counts as shown, like "70.3K", which voice control users would say.
      aria-describedby={nameId}
      href={getRepoUrl(countsProps.repo)}
      newTab
      // Quieter than the project's name link above it, until hovered.
      tone="subtle"
      className={cn(
        'inline-flex flex-wrap items-center justify-end gap-y-0.5',
        // As far from the counts as they are from each other, with room.
        'gap-x-2.5'
      )}
      {...focusProps}
      data-testid="project-repo-link">
      <ProjectCounts
        {...countsProps}
        open={countsOpen}
        onOpenChange={setCountsOpen}
      />
      <Tooltip content="GitHub Repository">
        {/* Keeps its icon on its line. */}
        <span className="whitespace-nowrap">
          repo{' '}
          <Icon
            name="external-link"
            className="inline-block size-[1em] align-[-0.125em]"
          />
        </span>
      </Tooltip>
    </Link>
  )
}
