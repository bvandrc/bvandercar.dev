import { useEffect, useState } from 'react'
import { useEasedScrollIntoView, useTimer } from '@bvandrc/react-toolkit'
import { ChevronRight } from 'lucide-react'
import { Collapsible } from 'radix-ui'

import { cn } from '@/utils'

export type LivePreviewProps = Pick<React.ComponentProps<'div'>, 'className'> &
  Pick<React.ComponentProps<'button'>, 'aria-describedby'> &
  Pick<Collapsible.CollapsibleProps, 'open' | 'onOpenChange'> & {
    /** The page to show. */
    src: string
    /** What the page is, which names the frame for screen readers. */
    title: string
    /** How far to shrink the page, so more of its layout fits: 0.5 is half size. */
    scale?: number
    /** Pulses a glow around the toggle, to draw the eye to it. */
    pulse?: boolean
  }

/** How long after opening finishes to wait before scrolling the preview on screen, in ms. */
const SCROLL_DELAY_MS = 50

/**
 * A live page in an iframe, collapsed behind a toggle until asked for.
 *
 * The frame mounts only while open, so a closed preview loads nothing. Its
 * origin must be in the CSP's `frame-src`, in `site.config.ts`. Pass `open`
 * with `onOpenChange` to open and close it from outside as well.
 */
export const LivePreview = ({
  src,
  title,
  scale = 1,
  pulse = false,
  open: controlledOpen,
  onOpenChange,
  className,
  'aria-describedby': describedBy,
}: LivePreviewProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  // Reports each change whether or not `open` is passed, unlike
  // `useMaybeControlled`, which takes `onOpenChange` alone as control.
  const open = controlledOpen ?? uncontrolledOpen
  const { scrollIntoView } = useEasedScrollIntoView()
  const scrollTimer = useTimer()
  useEffect(() => {
    if (!open) {
      // Closed before the scroll ran: don't scroll to a preview going away.
      scrollTimer.clear()
    }
  }, [open, scrollTimer])
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setUncontrolledOpen(nextOpen)
        onOpenChange?.(nextOpen)
      }}
      className={cn('flex flex-col gap-2', className)}
      data-testid="live-preview">
      <Collapsible.Trigger
        aria-describedby={describedBy}
        className={cn(
          'group inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm',
          'transition-colors hover:border-accent hover:text-accent',
          'data-[pulse=true]:animate-glow-pulse'
        )}
        data-pulse={pulse}
        data-testid="live-preview-toggle">
        <ChevronRight
          aria-hidden="true"
          className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-90"
        />
        {`${open ? 'Hide' : 'Show'} live preview`}
      </Collapsible.Trigger>
      <Collapsible.Content
        className={cn(
          'overflow-hidden',
          // Grows to, and shrinks from, the height Radix measures.
          'data-[state=closed]:animate-collapsible-close data-[state=open]:animate-collapsible-open'
        )}
        onAnimationEnd={(event) => {
          // Shortly after it finishes opening, bring the whole preview on screen.
          if (open && event.target === event.currentTarget) {
            const preview = event.currentTarget
            scrollTimer.start(
              () => scrollIntoView(preview, 'nearest'),
              SCROLL_DELAY_MS
            )
          }
        }}>
        {/* Portrait on a narrow screen, where a phone layout fits better. */}
        <div className="aspect-[9/16] max-h-[85dvh] w-full overflow-hidden rounded-md border border-border bg-black md:aspect-video">
          <iframe
            src={src}
            title={`${title} live preview`}
            // Sandboxed so the page can't navigate this one away. It keeps its
            // own origin's storage, and its links can still open new tabs.
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            // Drawn at 1/scale the frame's size, then shrunk back to fit it.
            style={{
              width: `${100 / scale}%`,
              height: `${100 / scale}%`,
              transform: `scale(${scale})`,
            }}
            className="origin-top-left border-0"
            data-testid="live-preview-frame"
          />
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
