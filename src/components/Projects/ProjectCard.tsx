import { useId, useRef, useState } from 'react'
import { useIsMobile } from '@bvandrc/react-toolkit'
import { pick } from 'es-toolkit'

import { LivePreview } from '@/components/LivePreview'
import { BrandIcon } from '@/components/primitives/BrandIcon'
import { Card } from '@/components/primitives/Card'
import { Link } from '@/components/primitives/Link'
import { Tooltip } from '@/components/primitives/Tooltip'
import { TYPE_ICONS } from '@/generated/profile/content/project-types'
import type { Project } from '@/generated/profile/content/projects'
import { cn } from '@/utils'
import { RepoLink } from './RepoLink'

// Matches the ink-muted theme token in src/styles/index.css.
const TYPE_ICON_COLOR = '9fb0c8'

export type ProjectCardProps = {
  project: Project
  /** Whether a live preview's toggle pulses, to draw the eye to it. */
  pulsePreview: boolean
  onPreviewOpen: () => void
}

/** A project's name, type, blurb, repo link, and live preview or screenshot. */
export const ProjectCard = ({
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
        <h4
          className={cn(
            'col-start-2 font-semibold',
            // A size up, on the 24px line the name had before, so the card keeps its height.
            'text-lg leading-6'
          )}>
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
        <RepoLink
          {...pick(project, ['repo', 'npmPackage', 'pypiPackage'])}
          nameId={nameId}
        />
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
