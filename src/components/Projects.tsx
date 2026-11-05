import { useId } from 'react'
import { ExternalLink } from 'lucide-react'

import { TYPE_ICONS } from '@/generated/profile/content/project-types'
import type { Project } from '@/generated/profile/content/projects'
import { PROJECTS } from '@/generated/profile/content/projects'
import { SECTIONS } from '@/generated/profile/content/sections'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { cn } from '@/utils'
import { BrandIcon } from './primitives/BrandIcon'
import { Card } from './primitives/Card'
import { Link } from './primitives/Link'
import { Section } from './Section'

// Matches the ink-muted theme token in src/styles/index.css.
const TYPE_ICON_COLOR = '9fb0c8'

const repoUrl = (repo: string) => `https://github.com/bvandrc/${repo}`

/** `formatCount(1, 'PR')` → `'1 PR'`, `formatCount(654, 'PR')` → `'654 PRs'`. */
const formatCount = (count: number, noun: string) =>
  `${count.toLocaleString('en-US')} ${count === 1 ? noun : `${noun}s`}`

/** A visual divider, which screen readers would otherwise read as "middle dot". */
const Separator = () => <span aria-hidden="true">·</span>

const ProjectCard = ({ project }: { project: Project }) => {
  const counts = REPO_COUNTS[project.repo]
  const nameId = useId()
  const repoLinkId = useId()
  return (
    <Card
      className={cn(
        'flex h-full flex-col gap-3',
        'transition-[box-shadow,border-color] duration-200',
        // Glows orange on hover, or while a link inside has keyboard focus.
        'hover:border-orange-400 hover:shadow-glow-24 hover:shadow-orange-500',
        'has-focus-visible:border-orange-400 has-focus-visible:shadow-glow-24 has-focus-visible:shadow-orange-500'
      )}
      data-testid="project-card">
      <div className="flex items-center justify-center gap-2">
        <h4 className="font-semibold">
          <Link href={project.href} newTab>
            <span id={nameId}>{project.name}</span>
          </Link>
        </h4>
        <BrandIcon
          slug={TYPE_ICONS[project.type].slug}
          color={TYPE_ICON_COLOR}
          title={TYPE_ICONS[project.type].title}
          size={14}
          className="size-3.5"
        />
      </div>
      <p className="text-sm text-ink-muted">{project.blurb}</p>
      <Link
        id={repoLinkId}
        // Every card's link reads "repo", so name the project it's for.
        aria-labelledby={`${nameId} ${repoLinkId}`}
        href={repoUrl(project.repo)}
        newTab
        tone="muted"
        className="text-xs">
        {counts && (
          <>
            {formatCount(counts.commits, 'commit')} <Separator />{' '}
            {formatCount(counts.prs, 'PR')} <Separator />{' '}
          </>
        )}
        repo{' '}
        <ExternalLink
          aria-hidden="true"
          className="inline-block size-[1em] align-[-0.125em]"
        />
      </Link>
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
  <Section
    icon={SECTIONS.PROJECTS.icon}
    title={SECTIONS.PROJECTS.title}
    data-testid="projects">
    {PROJECTS.map((group) => (
      <Section
        key={group.title}
        icon={group.icon}
        title={group.title}
        level="h3"
        className="flex flex-col gap-3">
        {group.intro && <p className="text-ink-muted">{group.intro}</p>}
        {/* biome-ignore lint/a11y/noRedundantRoles: Safari drops list semantics once Tailwind removes the bullets. */}
        <ul role="list" className="grid gap-4 md:grid-cols-2">
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
