import { useId, useRef, useState } from 'react'
import { useIsMobile } from '@bvandrc/react-toolkit'
import { objectEntries } from 'ts-extras'
import type { ValueOf } from 'type-fest'

import { TYPE_ICONS } from '@/generated/profile/content/project-types'
import type {
  Project,
  ProjectSection,
} from '@/generated/profile/content/projects'
import { PROJECTS } from '@/generated/profile/content/projects'
import { SECTIONS } from '@/generated/profile/content/sections'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import type { GlyphName } from '@/lib/icons'
import { cn } from '@/utils'
import { LivePreview } from './LivePreview'
import { BrandIcon } from './primitives/BrandIcon'
import { Card } from './primitives/Card'
import { Icon } from './primitives/Icon'
import { Link } from './primitives/Link'
import { Tooltip } from './primitives/Tooltip'
import { Section, SubSection } from './Section'

// Matches the ink-muted theme token in src/styles/index.css.
const TYPE_ICON_COLOR = '9fb0c8'

const repoUrl = (repo: string) => `https://github.com/bvandrc/${repo}`

type RepoCounts = NonNullable<ValueOf<typeof REPO_COUNTS>>

// The GitHub profile README's counts, in its order, with Lucide's take on its
// Octicons to match this site's other glyphs.
const COUNT_KINDS = {
  commits: { glyph: 'git-commit-horizontal', noun: 'commit' },
  prs: { glyph: 'git-pull-request', noun: 'PR' },
  downloads: { glyph: 'download', noun: 'download' },
} satisfies Record<keyof RepoCounts, { glyph: GlyphName; noun: string }>

type GridLayout = 'preview' | 'pairs'

// A group with a live preview takes the full width, so the page inside it has
// room; the rest pair up from md.
const GRID_CLASSES = {
  preview: 'grid gap-4',
  pairs: 'grid gap-4 md:grid-cols-2',
} satisfies Record<GridLayout, string>

const gridLayout = ({ projects }: ProjectSection): GridLayout =>
  projects.some(({ embed }) => embed) ? 'preview' : 'pairs'

/**
 * A repo's counts as glyphs with shortened numbers, in full as alt text and on
 * hover, like "3,120 downloads".
 *
 * Renders nothing for a repo with no counts.
 */
const ProjectCounts = ({ repo }: { repo: string }) => {
  const counts = REPO_COUNTS[repo]
  if (!counts) {
    return null
  }
  const shown = objectEntries(COUNT_KINDS).flatMap(
    ([kind, { glyph, noun }]) => {
      const count = counts[kind]
      return count === undefined ? [] : [{ kind, glyph, noun, count }]
    }
  )
  const label = shown
    .map(({ count, noun }) => formatCount(count, noun))
    .join(', ')
  return (
    <Tooltip content={label}>
      {/* An image, like the profile README's badge, so its name can be the
          full counts rather than the shortened ones it shows. */}
      <span
        role="img"
        aria-label={label}
        className="inline-flex items-center gap-2.5"
        data-testid="project-counts">
        {shown.map(({ kind, glyph, count }) => (
          <span key={kind} className="inline-flex items-center gap-1">
            <Icon name={glyph} className="size-[1.1em]" />
            {formatCompactCount(count)}
          </span>
        ))}
      </span>
    </Tooltip>
  )
}

type RepoLinkProps = {
  repo: string
  /** The `id` of the project's name, which describes the link */
  nameId: string
}

/**
 * A project's link to its GitHub repo: its counts, then "repo".
 *
 * Each part shows its own tooltip on hover, and keyboard focus on the link
 * shows the "repo" one.
 */
const RepoLink = ({ repo, nameId }: RepoLinkProps) => {
  const [repoTooltipOpen, setRepoTooltipOpen] = useState(false)
  const pointerDownRef = useRef(false)
  return (
    <Link
      // Its name is its counts in full, then "repo", which needs the project
      // beside it. A label naming the project too would no longer contain the
      // counts as shown, like "70.3K", which voice control users would say.
      aria-describedby={nameId}
      href={repoUrl(repo)}
      newTab
      tone="muted"
      className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
      onPointerDown={() => {
        pointerDownRef.current = true
      }}
      // A click focuses the link too, which opens no tooltip, the same as
      // Radix's own triggers.
      onFocus={() => setRepoTooltipOpen(!pointerDownRef.current)}
      onBlur={() => {
        pointerDownRef.current = false
        setRepoTooltipOpen(false)
      }}
      data-testid="project-repo-link">
      <ProjectCounts repo={repo} />
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
  const nameId = useId()
  const cardRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const [previewOpen, setPreviewOpen] = useState(false)
  const changePreviewOpen = (open: boolean) => {
    setPreviewOpen(open)
    if (open) {
      onPreviewOpen()
    }
  }
  return (
    <Card
      ref={cardRef}
      // A click anywhere else on a card with a live preview toggles it too.
      onSurfaceClick={
        project.embed ? () => changePreviewOpen(!previewOpen) : undefined
      }
      className={cn(
        'flex h-full flex-col gap-3',
        // Edge to edge on a phone, past the page's px-5 gutter in App.tsx.
        '-mx-5 rounded-none border-x-0 md:mx-0 md:rounded-xl md:border-x',
        'transition-[box-shadow,border-color] duration-200',
        // Glows orange on hover, or while a link inside has keyboard focus.
        'hover:border-orange-400 hover:shadow-glow-24 hover:shadow-orange-500',
        'has-focus-visible:border-orange-400 has-focus-visible:shadow-glow-24 has-focus-visible:shadow-orange-500'
      )}
      data-testid="project-card">
      {/* Equal side columns center the name on the card, with the icon beside it. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <h4 className="col-start-2 font-semibold">
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
      <p className="text-xs">
        <RepoLink repo={project.repo} nameId={nameId} />
      </p>
      {project.embed ? (
        <LivePreview
          src={project.href}
          title={project.name}
          scale={project.embed.scale}
          // Every card's toggle reads the same, so name the project it's for.
          aria-describedby={nameId}
          pulse={pulsePreview}
          // Opening centers the whole card on screen, not just the preview. A
          // phone's screen is too short for both, so it centers the preview.
          scrollTargetRef={isMobile ? undefined : cardRef}
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
      glyph={SECTIONS.PROJECTS.glyph}
      title={SECTIONS.PROJECTS.title}
      data-testid="projects">
      {PROJECTS.map((group) => (
        <SubSection
          key={group.title}
          // React Websites has its logo and no glyph; every other group, a glyph.
          icon={group.glyph ?? group.icon}
          title={group.title}>
          {group.intro && (
            <p className="font-semibold text-ink-muted">{group.intro}</p>
          )}
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
        </SubSection>
      ))}
    </Section>
  )
}
