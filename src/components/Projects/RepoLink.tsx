import { Icon } from '@/components/primitives/Icon'
import { Link } from '@/components/primitives/Link'
import { Tooltip } from '@/components/primitives/Tooltip'
import { useFocusVisibleOpen } from '@/hooks/useFocusVisibleOpen'
import { getRepoUrl } from '~/github'
import { ProjectCounts, type ProjectCountsProps } from './ProjectCounts'

export type RepoLinkProps = Omit<
  ProjectCountsProps,
  'open' | 'onOpenChange'
> & {
  /** The `id` of the project's name, which describes the link */
  nameId: string
}

/**
 * A project's link to its GitHub repo: its counts, then "repo".
 *
 * Each part shows its own tooltip on hover, and keyboard focus on the link
 * shows the counts' one, charts and all.
 */
export const RepoLink = ({ nameId, ...countsProps }: RepoLinkProps) => {
  const {
    open: countsOpen,
    setOpen: setCountsOpen,
    focusProps,
  } = useFocusVisibleOpen()
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
      // As far from the counts as they are from each other, with room.
      className="inline-flex flex-wrap items-center justify-end gap-x-2.5 gap-y-0.5"
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
