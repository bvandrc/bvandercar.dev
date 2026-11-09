import { useId, useRef, useState } from 'react'
import { useIsMobile } from '@bvandrc/react-toolkit'
import { pick } from 'es-toolkit'

import { LivePreview } from '@/components/LivePreview'
import { BrandIcon } from '@/components/primitives/BrandIcon'
import { Card } from '@/components/primitives/Card'
import { Link } from '@/components/primitives/Link'
import { Tooltip } from '@/components/primitives/Tooltip'
import { TYPE_ICONS } from '@/generated/profile/content/project-types'
import { fillBlurb, type Project } from '@/generated/profile/content/projects'
import { useShrinkToFit } from '@/hooks/useShrinkToFit'
import { cn } from '@/lib/cn'
import { THEME_COLORS } from '@/lib/theme-colors'
import { COUNTS_FIELDS } from '~/counts'
import { getProjectCounts } from './lib/project-counts'
import { RepoLink } from './RepoLink'

export type ProjectCardProps = {
  project: Project
  /** Whether it centers its name and blurb from md, as one spanning its group's full width does. */
  centered: boolean
  /** Whether a live preview's toggle pulses, to draw the eye to it. */
  pulsePreview: boolean
  onPreviewOpen: () => void
}

/** A project's name, type, blurb, repo link, and live preview or screenshot. */
export const ProjectCard = ({
  project,
  centered,
  pulsePreview,
  onPreviewOpen,
}: ProjectCardProps) => {
  const nameId = useId()
  const cardRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const typeIcon = TYPE_ICONS[project.type]
  const { counts } = getProjectCounts(pick(project, COUNTS_FIELDS))
  const headerRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLDivElement>(null)
  // Smaller only where that keeps its counts on the name's line.
  const isNameSmall = useShrinkToFit(headerRef, nameRef)
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
        'flex h-full flex-col gap-2.5',
        // Edge to edge on a phone, past the page's px-5 gutter in App.tsx.
        '-mx-5 md:mx-0',
        // Tighter on a phone, so more of each card fits on screen.
        'px-4 py-2 md:px-5 md:py-3.5',
        // Glows orange on hover, or while a link inside has keyboard focus.
        'hover-glow-24'
      )}
      data-testid="project-card">
      <div
        ref={headerRef}
        className={cn(
          'flex flex-wrap items-start justify-between gap-x-4 gap-y-1',
          // A centered card spans its group's width, so from md, where other
          // groups' cards pair up, it centers its name and blurb, with its
          // counts on the right. Below md, it lines up like the rest.
          centered && 'md:grid md:grid-cols-[1fr_auto_1fr]'
        )}>
        <div
          ref={nameRef}
          className={cn(
            'flex shrink-0 items-center gap-2',
            centered && 'md:col-start-2'
          )}>
          <h4
            className={cn(
              'font-semibold',
              isNameSmall ? 'text-base' : 'text-lg',
              // On the 24px line the name had before, whatever its size, so the
              // card keeps its height. After the size, whose own line height
              // would otherwise win.
              'leading-6'
            )}>
            <Tooltip content={project.href}>
              <Link href={project.href} newTab>
                <span id={nameId}>{project.name}</span>
              </Link>
            </Tooltip>
          </h4>
          <Tooltip content={typeIcon.title}>
            <BrandIcon
              slug={typeIcon.slug}
              color={THEME_COLORS.INK_MUTED}
              alt={typeIcon.title}
              size={14}
              className="size-3.5"
            />
          </Tooltip>
        </div>
        <p
          className={cn(
            'flex text-xs',
            // Grows from nothing, so it stays beside the name while its counts
            // fit, with "repo" wrapping below them, and only then drops below.
            'grow basis-0 justify-end',
            // Its 20px height, 2px down, centers the counts' 16px line on the
            // name's 24px one; with "repo" wrapped below, the pair outgrows it
            // and starts 2px down.
            'mt-0.5 min-h-5 items-center',
            centered && 'md:col-start-3'
          )}>
          <RepoLink {...pick(project, COUNTS_FIELDS)} nameId={nameId} />
        </p>
      </div>
      <p
        className={cn(
          'text-left text-sm text-ink-muted',
          // Closer to the name than the card's gap, as the name's own words.
          '-mt-1',
          centered && 'md:text-center'
        )}
        data-testid="project-blurb">
        {/* Its counts are the ones its glyphs show. */}
        {fillBlurb(project.blurb, counts)}
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
