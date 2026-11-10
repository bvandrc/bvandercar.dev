import { useId, useRef, useState } from 'react'
import { useIsMobile, useShrinkToFit } from '@bvandrc/react-toolkit'
import { pick } from 'es-toolkit'

import { LivePreview } from '@/components/LivePreview'
import { BrandIcon } from '@/components/primitives/BrandIcon'
import { Card } from '@/components/primitives/Card'
import { Link } from '@/components/primitives/Link'
import { Tooltip } from '@/components/primitives/Tooltip'
import { TYPE_ICONS } from '@/generated/profile/content/project-types'
import { fillBlurb, type Project } from '@/generated/profile/content/projects'
import { cn } from '@/lib/cn'
import { THEME_COLORS } from '@/lib/theme-colors'
import { COUNTS_FIELDS } from '~/counts'
import { getThumbnailPath, THUMBNAIL_WIDTHS } from '~/screenshots'
import { getProjectCounts } from './lib/project-counts'
import { RepoLink } from './RepoLink'

// A name's sizes, largest first, which it steps down only to keep its counts
// on its line.
const NAME_SIZES = ['text-lg', 'text-base', 'text-[15px]']

/** Where the site serves a repo-relative path ('./project-screenshots/…') from public/. */
const getPublicUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\.\//, '')}`

/** A screenshot's WebP thumbnails, as an image's `src` and `srcSet`, for the browser to pick the width it needs. */
const getThumbnail = (screenshot: string) => ({
  src: getPublicUrl(getThumbnailPath(screenshot, THUMBNAIL_WIDTHS[0])),
  srcSet: THUMBNAIL_WIDTHS.map(
    (width) => `${getPublicUrl(getThumbnailPath(screenshot, width))} ${width}w`
  ).join(', '),
})

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
  const countsFields = pick(project, COUNTS_FIELDS)
  const { counts } = getProjectCounts(countsFields)
  const headerRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLDivElement>(null)
  const nameStep = useShrinkToFit({
    lineRef: headerRef,
    textRef: nameRef,
    stepCount: NAME_SIZES.length,
  })
  const [previewOpen, setPreviewOpen] = useState(false)
  const screenshotSrc = project.screenshot && getPublicUrl(project.screenshot)
  // A live preview's card shows its screenshot small: beside its name and
  // blurb from md, and across its toggle below.
  const thumbnail =
    project.embed && project.screenshot
      ? getThumbnail(project.screenshot)
      : undefined
  const changePreviewOpen = (open: boolean) => {
    setPreviewOpen(open)
    if (open) {
      onPreviewOpen()
    }
  }
  return (
    <Card
      ref={cardRef}
      // A click anywhere else on a card with a live preview opens it too.
      // Only the toggle closes it, so a click on or around the open page,
      // even as it's still growing, leaves it open.
      onSurfaceClick={
        project.embed && !previewOpen
          ? () => changePreviewOpen(true)
          : undefined
      }
      className={cn(
        'flex h-full flex-col gap-2.5',
        // Edge to edge on a phone, past the page's px-5 gutter in App.tsx.
        '-mx-5 md:mx-0',
        // Tighter on a phone, so more of each card fits on screen. From md,
        // as wide at the sides as at the top and bottom.
        'px-4 py-2 md:p-3.5',
        // Glows orange on hover, or while a link inside has keyboard focus.
        'hover-glow-24'
      )}
      // Its thumbnail's hover shows on its live preview's toggle.
      data-preview-scope
      data-testid="project-card">
      <div className="flex grow gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div
            ref={headerRef}
            className={cn(
              'flex flex-wrap items-start justify-between gap-x-4 gap-y-1',
              // A centered card spans its group's width, so from md, where
              // other groups' cards pair up, it centers its name and blurb,
              // with its counts on the right. Below md, it lines up like the
              // rest.
              centered && 'md:grid md:grid-cols-[1fr_auto_1fr]'
            )}>
            <div
              ref={nameRef}
              className={cn(
                'flex shrink-0 items-center gap-2',
                centered && 'relative md:col-start-2'
              )}>
              <h4
                className={cn(
                  'font-semibold',
                  NAME_SIZES[nameStep],
                  // On the 24px line the name had before, whatever its size, so
                  // the card keeps its height. After the size, whose own line
                  // height would otherwise win.
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
                  className={cn(
                    'size-3.5',
                    // A centered name centers by its own text: its icon
                    // hangs off its right, out of the width being centered.
                    centered &&
                      'md:absolute md:top-1/2 md:left-full md:ml-2 md:-translate-y-1/2'
                  )}
                />
              </Tooltip>
            </div>
            <p
              className={cn(
                'flex text-xs',
                // Grows from nothing, so it stays beside the name while its
                // counts fit, with "repo" wrapping below them, and only then
                // drops below.
                'grow basis-0 justify-end',
                // Its 20px height, 2px down, centers the counts' 16px line on
                // the name's 24px one; with "repo" wrapped below, the pair
                // outgrows it and starts 2px down.
                'mt-0.5 min-h-5 items-center',
                centered && 'md:col-start-3'
              )}>
              <RepoLink {...countsFields} nameId={nameId} />
            </p>
          </div>
          <p
            className={cn(
              'text-left text-sm text-ink-muted',
              // Closer to the name than the card's gap, as the name's own
              // words.
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
              // Every card's toggle reads the same, so name the project it's
              // for.
              aria-describedby={nameId}
              pulse={pulsePreview}
              // Opening centers the whole card on screen, not just the
              // preview. A phone's screen is too short for both, so it
              // centers the preview.
              scrollTargetRef={isMobile ? undefined : cardRef}
              poster={thumbnail}
              open={previewOpen}
              onOpenChange={changePreviewOpen}
              className="mt-auto"
            />
          ) : (
            screenshotSrc && (
              <img
                src={screenshotSrc}
                alt={`${project.name} screenshot`}
                loading="lazy"
                className="mt-auto w-full rounded-md border border-border"
              />
            )
          )}
        </div>
        {thumbnail && !previewOpen && (
          // What the site looks like, until its live preview takes over. From
          // md: below, the toggle carries it.
          <div className="relative hidden w-60 shrink-0 md:block">
            {/* Out of the flow, so it fills the height the name, blurb, and
                toggle give the card, rather than adding its own. */}
            <img
              {...thumbnail}
              alt={`${project.name} screenshot`}
              sizes="240px"
              loading="lazy"
              className={cn(
                'absolute inset-0 size-full rounded-md border border-border',
                // Cropped to fit, keeping the page's top left corner, where its
                // header and the start of its text are.
                'object-cover object-left-top',
                // A click on it opens the preview, as on the rest of the
                // card's surface, so it takes a hand, and its hover shows on
                // the toggle, the control it stands in for.
                'cursor-pointer'
              )}
              data-opens-preview
              data-testid="project-thumbnail"
            />
          </div>
        )}
      </div>
    </Card>
  )
}
