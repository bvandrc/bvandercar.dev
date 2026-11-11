import { useEffect, useRef } from 'react'
import {
  useIsMobile,
  useMaybeControlled,
  useScrollIntoView,
  useTimer,
} from '@bvandrc/react-toolkit'
import { Collapsible } from 'radix-ui'
import type { RequireAllOrNone } from 'type-fest'

import { cn } from '@/lib/cn'
import { Icon } from './primitives/Icon'

export type LivePreviewProps = Pick<React.ComponentProps<'div'>, 'className'> &
  Pick<React.ComponentProps<'button'>, 'aria-describedby'> &
  // Both or neither: `onOpenChange` alone would leave nothing to open it.
  RequireAllOrNone<
    Pick<Collapsible.CollapsibleProps, 'open' | 'onOpenChange'>
  > & {
    /** The page to show. */
    src: string
    /** What the page is, which names the frame for screen readers. */
    title: string
    /** How far to shrink the page on a wide screen, so more of its layout fits: 0.5 is half size. A phone shows it at full size. */
    scale?: number
    /** Pulses a glow around the toggle, to draw the eye to it. */
    pulse?: boolean
    /** What to center on screen once opened, such as a card around it; defaults to the preview and its toggle. */
    scrollTargetRef?: React.RefObject<HTMLElement | null>
    /** A screenshot of the page, drawn across the toggle while it's closed below sm, where nothing beside the toggle has room for one. */
    poster?: Pick<React.ComponentProps<'img'>, 'src' | 'srcSet'> & {
      /** How many px of the screenshot's top to show; defaults to 64. */
      height?: number
    }
  }

/** How many px of its screenshot's top a poster shows, unless it says otherwise. */
const DEFAULT_POSTER_HEIGHT = 64

/** How long after opening finishes to wait before scrolling the preview on screen, in ms. */
const SCROLL_DELAY_MS = 50

// Rounds a poster, and its fade, into the toggle's corners, inside its 1px
// border. Where the toggle clipped them instead, it would clip its pulse's
// glow too.
const POSTER_ROUNDING = 'rounded-[calc(var(--radius-md)-1px)]'

/**
 * A live page in an iframe, collapsed behind a toggle until asked for.
 *
 * The frame mounts only while open, so a closed preview loads nothing. Its
 * origin must be in the CSP's `frame-src`, in `site.config.ts`. Pass `open`
 * with `onOpenChange` to open and close it from outside as well. Its toggle
 * looks hovered while an element marked `data-opens-preview` is, inside one
 * marked `data-preview-scope` around both.
 */
export const LivePreview = ({
  src,
  title,
  scale = 1,
  pulse = false,
  scrollTargetRef,
  poster,
  open: controlledOpen,
  onOpenChange,
  className,
  'aria-describedby': describedBy,
}: LivePreviewProps) => {
  const [open, setOpen] = useMaybeControlled(
    controlledOpen,
    onOpenChange,
    false
  )
  // iOS Safari can't touch-scroll a page inside a transformed iframe, so a
  // phone draws it untransformed, at full size, where the portrait frame
  // gives it its own phone layout anyway.
  const frameScale = useIsMobile() ? 1 : scale
  const rootRef = useRef<HTMLDivElement>(null)
  const { scrollIntoView } = useScrollIntoView({ scrollBehavior: 'smooth' })
  const scrollTimer = useTimer()
  // Only while closed: once open, the page itself takes the screenshot's place.
  const shownPoster = open ? undefined : poster
  useEffect(() => {
    if (!open) {
      // Closed before the scroll ran: don't scroll to a preview going away.
      scrollTimer.clear()
    }
  }, [open, scrollTimer])
  return (
    <Collapsible.Root
      ref={rootRef}
      open={open}
      onOpenChange={setOpen}
      className={cn('flex flex-col gap-2', className)}
      data-testid="live-preview">
      <Collapsible.Trigger
        aria-describedby={describedBy}
        className={cn(
          'group relative inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm',
          // A hand, like a link's, which Tailwind leaves off buttons.
          'cursor-pointer',
          // Also while something else in its `data-preview-scope` that
          // opens it is hovered, so the two read as one control.
          'transition-colors preview-hover:border-accent preview-hover:text-accent',
          'data-[pulse=true]:glow-pulse',
          // Below sm, a poster fills the toggle, with its label over the
          // bottom edge.
          shownPoster && 'max-sm:block max-sm:p-0'
        )}
        data-pulse={pulse}
        data-testid="live-preview-toggle">
        {shownPoster && (
          <>
            <img
              src={shownPoster.src}
              srcSet={shownPoster.srcSet}
              // The toggle's label names it; the screenshot only shows the
              // page.
              alt=""
              // As wide as the screen, less the card's padding, below sm.
              sizes="100vw"
              loading="lazy"
              style={{ height: shownPoster.height ?? DEFAULT_POSTER_HEIGHT }}
              className={cn(
                'w-full sm:hidden',
                // Cropped to fit, keeping the page's top, where its header is.
                'object-cover object-top',
                POSTER_ROUNDING
              )}
              data-testid="live-preview-poster"
            />
            {/* A fade that eases from clear at the poster's top to a nearly
                solid surface under the label, so the label reads against any
                screenshot while the screenshot still shows through. */}
            <span
              className={cn(
                'absolute inset-0 sm:hidden',
                POSTER_ROUNDING,
                'bg-linear-to-t from-surface/90 from-15% via-surface/45 via-55% to-transparent'
              )}
            />
          </>
        )}
        <span
          className={cn(
            'inline-flex items-center justify-center gap-2',
            // Over the poster's bottom edge.
            shownPoster &&
              'max-sm:absolute max-sm:inset-x-0 max-sm:bottom-0 max-sm:flex max-sm:pb-1.5',
            // A shadow, for where the busier screenshots show through the fade.
            shownPoster && 'max-sm:text-shadow-md max-sm:text-shadow-black/80'
          )}>
          <Icon
            name="chevron-right"
            className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-90"
          />
          {`${open ? 'Hide' : 'Show'} live preview`}
        </span>
      </Collapsible.Trigger>
      <Collapsible.Content
        className={cn(
          'overflow-hidden',
          // Grows to, and shrinks from, the height Radix measures.
          'data-[state=closed]:animate-collapsible-close data-[state=open]:animate-collapsible-open'
        )}
        onAnimationEnd={(event) => {
          // Shortly after it finishes opening, center the preview and its
          // toggle, or whatever holds them, in the screen below the contents
          // bar, which the page's scroll padding keeps clear; one too tall to
          // fit lines its top up under the bar instead, keeping the toggle in
          // view.
          if (open && event.target === event.currentTarget) {
            scrollTimer.start(() => {
              const target = scrollTargetRef?.current ?? rootRef.current
              if (target) {
                scrollIntoView(target, 'center')
              }
            }, SCROLL_DELAY_MS)
          }
        }}>
        {/* Portrait on a narrow screen, where a phone layout fits better. */}
        <div
          className={cn(
            'aspect-[9/16] w-full overflow-hidden rounded-md border border-border bg-black md:aspect-video',
            // Capped by the small viewport height, which holds still as a
            // phone's address bar hides and shows on scroll, where `dvh`
            // would resize the frame, and re-lay out the page in it, mid-scroll.
            'max-h-[85svh]'
          )}>
          <iframe
            src={src}
            title={`${title} live preview`}
            // Sandboxed so the page can't navigate this one away. It keeps its
            // own origin's storage, and its links can still open new tabs.
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            // Drawn at 1/scale the frame's size, then shrunk back to fit it.
            style={
              frameScale === 1
                ? undefined
                : {
                    width: `${100 / frameScale}%`,
                    height: `${100 / frameScale}%`,
                    transform: `scale(${frameScale})`,
                  }
            }
            className="size-full origin-top-left border-0"
            data-testid="live-preview-frame"
          />
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
