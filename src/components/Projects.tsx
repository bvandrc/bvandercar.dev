import { PROJECTS } from '@/generated/profile/content/projects'
import type { Project, ProjectType } from '@/generated/profile/content/types'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { Card } from './primitives/Card'
import { Section } from './Section'

const TYPE_LABELS = {
  react: 'React',
  npm: 'npm package',
  github: 'GitHub Action',
  python: 'Python',
  arduino: 'Arduino',
} as const satisfies Record<ProjectType, string>

const LINK_CLASSES = 'text-accent hover:text-accent-hover'

const repoUrl = (repo: string) => `https://github.com/bvandrc/${repo}`

/** `formatCount(1, 'PR')` → `'1 PR'`, `formatCount(654, 'PR')` → `'654 PRs'`. */
const formatCount = (count: number, noun: string) =>
  `${count.toLocaleString('en-US')} ${count === 1 ? noun : `${noun}s`}`

const ProjectCard = ({ project }: { project: Project }) => {
  const counts = REPO_COUNTS[project.repo]
  return (
    <Card className="flex h-full flex-col gap-3" data-testid="project-card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h4 className="font-semibold">
          <a
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASSES}
            data-testid="project-card-name">
            {project.name}
          </a>
        </h4>
        <span className="text-xs text-ink-muted">
          {TYPE_LABELS[project.type]}
        </span>
      </div>
      <p className="text-sm text-ink-muted">
        {project.blurb}
        {project.private && <em> (private repo)</em>}
      </p>
      <a
        href={repoUrl(project.repo)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-ink-muted hover:text-accent"
        data-testid="project-card-repo-link">
        {counts
          ? `${formatCount(counts.commits, 'commit')} · ${formatCount(counts.prs, 'PR')}`
          : 'Source on GitHub'}
      </a>
      {project.screenshot && (
        <img
          src={`${import.meta.env.BASE_URL}${project.screenshot.replace(/^\.\//, '')}`}
          alt={`${project.name} screenshot`}
          loading="lazy"
          className="mt-auto w-full rounded-md border border-border"
          data-testid="project-card-screenshot"
        />
      )}
    </Card>
  )
}

export const Projects = () => (
  <Section emoji="💎" title="Projects" data-testid="projects">
    {PROJECTS.map((group) => (
      <Section
        key={group.title}
        emoji={group.emoji}
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
