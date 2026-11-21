import { Icon } from '@/components/primitives/Icon'
import { Link } from '@/components/primitives/Link'
import { Tooltip } from '@/components/primitives/Tooltip'
import type { Project } from '@/generated/profile/content/projects'
import { cn } from '@/lib/cn'
import { getRepoUrl } from '~/github'
import { ProjectCounts, type ProjectCountsProps } from './ProjectCounts'

export type CountsAndRepoLinkProps = Omit<ProjectCountsProps, 'open'> &
  Pick<Project, 'privateRepo'> & {
    /** The `id` of the project's name, which describes the link */
    nameId: string
    /** Opens the counts' tooltip, charts and all, as it turns true, as for a URL asking for them */
    openCounts?: boolean
  }

/**
 * A project's counts, then "repo", a link to its GitHub repo.
 *
 * The counts only open and close their tooltip, charts and all, on hover,
 * keyboard focus, or a press, so a tap closing it never follows the link.
 * A private repo would 404 for a visitor, so its counts stand alone.
 * `openCounts` opens the counts' tooltip too, which then closes as any would.
 */
export const CountsAndRepoLink = ({
  nameId,
  privateRepo = false,
  openCounts = false,
  ...countsProps
}: CountsAndRepoLinkProps) => (
  <span
    className={cn(
      // The counts in the link's color, beside it.
      'inline-flex flex-wrap items-center justify-end gap-y-0.5 text-link-subtle',
      // As far from the counts as they are from each other, with room.
      'gap-x-2.5'
    )}>
    <ProjectCounts {...countsProps} open={openCounts} />
    {!privateRepo && (
      <Link
        // Its name, "repo", needs the project beside it.
        aria-describedby={nameId}
        href={getRepoUrl(countsProps.repo)}
        newTab
        // Quieter than the project's name link above it, until hovered.
        tone="subtle"
        // Keeps its icon on its line.
        className="whitespace-nowrap"
        data-testid="project-repo-link">
        <Tooltip content="GitHub Repository">
          <span>
            repo{' '}
            <Icon
              name="external-link"
              className="inline-block size-[1em] align-[-0.125em]"
            />
          </span>
        </Tooltip>
      </Link>
    )}
  </span>
)
