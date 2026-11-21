import { Icon } from '@/components/primitives/Icon'
import { Link } from '@/components/primitives/Link'
import { Tooltip } from '@/components/primitives/Tooltip'
import type { Project } from '@/generated/profile/content/projects'
import { getRepoUrl } from '~/github'

type RepoLinkProps = Pick<Project, 'repo'> & {
  /** The `id` of the project's name, which describes the link */
  nameId: string
}

/** "repo", with an external-link icon, linking to a project's GitHub repo in a new tab. */
export const RepoLink = ({ repo, nameId }: RepoLinkProps) => (
  <Link
    // Its name, "repo", needs the project beside it.
    aria-describedby={nameId}
    href={getRepoUrl(repo)}
    newTab
    // Quieter than the project's name link, until hovered.
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
)
