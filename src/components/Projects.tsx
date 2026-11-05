import { PROJECTS } from '@/generated/profile/content/projects'
import type { Project, ProjectType } from '@/generated/profile/content/types'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { Card } from './primitives/Card'
import { ExternalLinkIcon } from './primitives/ExternalLinkIcon'
import { Section } from './Section'

type TypeIcon = {
  /** Simple Icons slug, as bvandrc's README uses for the same type */
  slug: string
  /** Alt text and tooltip */
  title: string
}

const TYPE_ICONS = {
  react: { slug: 'react', title: 'React' },
  npm: { slug: 'npm', title: 'npm package' },
  github: { slug: 'github', title: 'GitHub Action' },
  python: { slug: 'python', title: 'Python' },
  arduino: { slug: 'arduino', title: 'Arduino' },
  worker: { slug: 'cloudflareworkers', title: 'Cloudflare Worker' },
} as const satisfies Record<ProjectType, TypeIcon>

// Matches the ink-muted theme token in src/styles/index.css.
const TYPE_ICON_COLOR = '9fb0c8'

const LINK_CLASSES = 'text-accent hover:text-accent-hover'

const repoUrl = (repo: string) => `https://github.com/bvandrc/${repo}`

/** `formatCount(1, 'PR')` → `'1 PR'`, `formatCount(654, 'PR')` → `'654 PRs'`. */
const formatCount = (count: number, noun: string) =>
  `${count.toLocaleString('en-US')} ${count === 1 ? noun : `${noun}s`}`

const ProjectCard = ({ project }: { project: Project }) => {
  const counts = REPO_COUNTS[project.repo]
  return (
    <Card className="flex h-full flex-col gap-3" data-testid="project-card">
      <div className="flex items-center justify-center gap-2">
        <h4 className="font-semibold">
          <a
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASSES}>
            {project.name}
          </a>
        </h4>
        <img
          src={`https://cdn.simpleicons.org/${TYPE_ICONS[project.type].slug}/${TYPE_ICON_COLOR}`}
          alt={TYPE_ICONS[project.type].title}
          title={TYPE_ICONS[project.type].title}
          width={14}
          height={14}
          className="size-3.5"
        />
      </div>
      <p className="text-sm text-ink-muted">{project.blurb}</p>
      <a
        href={repoUrl(project.repo)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-ink-muted hover:text-accent">
        {counts &&
          `${formatCount(counts.commits, 'commit')} · ${formatCount(counts.prs, 'PR')} · `}
        repo <ExternalLinkIcon />
      </a>
      {project.screenshot && (
        <img
          src={`${import.meta.env.BASE_URL}${project.screenshot.replace(/^\.\//, '')}`}
          alt={`${project.name} screenshot`}
          loading="lazy"
          className="mt-auto w-full rounded-md border border-border"
        />
      )}
    </Card>
  )
}

export const Projects = () => (
  <Section icon="💎" title="Projects" data-testid="projects">
    {PROJECTS.map((group) => (
      <Section
        key={group.title}
        icon={group.icon}
        title={group.title}
        level="h3"
        className="flex flex-col gap-3">
        {group.intro && <p className="text-ink-muted">{group.intro}</p>}
        <ul className="grid gap-4 md:grid-cols-2">
          {group.projects.map((project) => (
            <li key={project.repo}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      </Section>
    ))}
  </Section>
)
