import { useId, useState } from 'react'
import { ExternalLink } from 'lucide-react'

import { TYPE_ICONS } from '@/generated/profile/content/project-types'
import type {
  Project,
  ProjectSection,
} from '@/generated/profile/content/projects'
import { PROJECTS } from '@/generated/profile/content/projects'
import { SECTIONS } from '@/generated/profile/content/sections'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { cn } from '@/utils'
import { LivePreview } from './LivePreview'
import { BrandIcon } from './primitives/BrandIcon'
import { Card } from './primitives/Card'
import { Link } from './primitives/Link'
import { Tooltip } from './primitives/Tooltip'
import { Section } from './Section'

// Matches the ink-muted theme token in src/styles/index.css.
const TYPE_ICON_COLOR = '9fb0c8'

const repoUrl = (repo: string) => `https://github.com/bvandrc/${repo}`

/** `formatCount(1, 'PR')` → `'1 PR'`, `formatCount(654, 'PR')` → `'654 PRs'`. */
const formatCount = (count: number, noun: string) =>
  `${count.toLocaleString('en-US')} ${count === 1 ? noun : `${noun}s`}`

type GridLayout = 'preview' | 'pairs'

// A group with a live preview takes the full width, so the page inside it has
// room; the rest pair up from md.
const GRID_CLASSES = {
  preview: 'grid gap-4',
  pairs: 'grid gap-4 md:grid-cols-2',
} satisfies Record<GridLayout, string>

const gridLayout = ({ projects }: ProjectSection): GridLayout =>
  projects.some(({ embed }) => embed) ? 'preview' : 'pairs'

/** A visual divider, which screen readers would otherwise read as "middle dot". */
const Separator = () => <span aria-hidden="true">·</span>

type ProjectCardProps = {
  project: Project
  /** Whether a live preview's toggle pulses, to draw the eye to it. */
  pulsePreview: boolean
  onPreviewOpen: () => void
}

const ProjectCard = ({
  project,
  pulsePreview,
  onPreviewOpen,
}: ProjectCardProps) => {
  const counts = REPO_COUNTS[project.repo]
  const nameId = useId()
  const repoLinkId = useId()
  const [previewOpen, setPreviewOpen] = useState(false)
  const changePreviewOpen = (open: boolean) => {
    setPreviewOpen(open)
    if (open) {
      onPreviewOpen()
    }
  }
  return (
    <Card
      // A click anywhere else on a card with a live preview toggles it too.
      onSurfaceClick={
        project.embed ? () => changePreviewOpen(!previewOpen) : undefined
      }
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
          <Tooltip content={project.href}>
            <Link href={project.href} newTab>
              <span id={nameId}>{project.name}</span>
            </Link>
          </Tooltip>
        </h4>
        <Tooltip content={TYPE_ICONS[project.type].title}>
          <BrandIcon
            slug={TYPE_ICONS[project.type].slug}
            color={TYPE_ICON_COLOR}
            alt={TYPE_ICONS[project.type].title}
            size={14}
            className="size-3.5"
          />
        </Tooltip>
      </div>
      <p className="text-sm text-ink-muted">{project.blurb}</p>
      <Tooltip content="GitHub Repository">
        <Link
          id={repoLinkId}
          // Every card's link reads "repo", so name the project it's for.
          aria-labelledby={`${nameId} ${repoLinkId}`}
          href={repoUrl(project.repo)}
          newTab
          tone="muted"
          className="text-xs"
          data-testid="project-repo-link">
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
      </Tooltip>
      {project.embed ? (
        <LivePreview
          src={project.href}
          title={project.name}
          scale={project.embed.scale}
          // Every card's toggle reads the same, so name the project it's for.
          aria-describedby={nameId}
          pulse={pulsePreview}
          open={previewOpen}
          onOpenChange={changePreviewOpen}
          className="mt-auto"
        />
      ) : (
        project.screenshot && (
          <img
            src={`${import.meta.env.BASE_URL}${project.screenshot.replace(/^\.\//, '')}`}
            alt={`${project.name} screenshot`}
            loading="lazy"
            className="mt-auto w-full rounded-md border border-border"
          />
        )
      )}
    </Card>
  )
}

export const Projects = () => {
  // Every preview toggle pulses on each page visit, until any one is opened.
  const [previewOpened, setPreviewOpened] = useState(false)
  return (
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
          <ul role="list" className={GRID_CLASSES[gridLayout(group)]}>
            {group.projects.map((project) => (
              <li key={project.repo}>
                <ProjectCard
                  project={project}
                  pulsePreview={!previewOpened}
                  onPreviewOpen={() => setPreviewOpened(true)}
                />
              </li>
            ))}
          </ul>
        </Section>
      ))}
    </Section>
  )
}
