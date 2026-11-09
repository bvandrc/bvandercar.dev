import { useState } from 'react'

import { Icon } from '@/components/primitives/Icon'
import { Link } from '@/components/primitives/Link'
import { Tooltip } from '@/components/primitives/Tooltip'
import { getRepoUrl } from '~/github'
import { ProjectCounts, type ProjectCountsProps } from './ProjectCounts'

export type RepoLinkProps = ProjectCountsProps & {
  /** The `id` of the project's name, which describes the link */
  nameId: string
}

/**
 * A project's link to its GitHub repo: its counts, then "repo".
 *
 * Each part shows its own tooltip on hover, and keyboard focus on the link
 * shows the "repo" one.
 */
export const RepoLink = ({ nameId, ...countsProps }: RepoLinkProps) => {
  const [repoTooltipOpen, setRepoTooltipOpen] = useState(false)
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
      className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
      // A click focuses the link too, which opens no tooltip, the same as
      // Radix's own triggers: only focus the browser would ring does.
      onFocus={(event) =>
        setRepoTooltipOpen(event.currentTarget.matches(':focus-visible'))
      }
      onBlur={() => setRepoTooltipOpen(false)}
      data-testid="project-repo-link">
      <ProjectCounts {...countsProps} />
      <Tooltip
        content="GitHub Repository"
        open={repoTooltipOpen}
        onOpenChange={setRepoTooltipOpen}>
        <span>
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
