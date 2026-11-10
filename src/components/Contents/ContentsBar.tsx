import { useEffect, useRef } from 'react'
import { cva } from 'class-variance-authority'

import { useActiveSection } from '@/hooks/useActiveSection'
import { cn } from '@/lib/cn'
import { List } from '../primitives/List'
import {
  CONTENTS_ENTRIES,
  CONTENTS_SECTION_IDS,
  ContentsLink,
} from './ContentsLink'
import { ContentsMenu } from './ContentsMenu'

/**
 * How near a section's heading must scroll to where its contents link lands
 * it, in px, to light that link up: once it has mostly taken the screen.
 */
const ACTIVE_SLACK = 150

const barVariants = cva(
  [
    'fixed inset-x-0 top-0 z-40 h-contents-bar border-b border-border bg-canvas/90 backdrop-blur',
    // Slides down into view, and back up out of it; hidden, it's out of the
    // tab order and the accessibility tree.
    'transition-[translate,visibility] duration-200 ease-out',
  ],
  {
    variants: {
      shown: {
        true: 'visible translate-y-0',
        false: 'invisible -translate-y-full',
      },
    },
  }
)

type ContentsBarProps = {
  /** Whether it's on screen, once the page's own contents have scrolled away. */
  shown: boolean
}

/**
 * The contents again, pinned to the top of the screen, with the link to the
 * section in view lit up, and a chevron that lists them all.
 *
 * On a narrow screen, the links scroll sideways, keeping the lit one in view.
 */
export const ContentsBar = ({ shown }: ContentsBarProps) => {
  const activeId = useActiveSection(CONTENTS_SECTION_IDS, ACTIVE_SLACK)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scroller = scrollerRef.current
    const link = scroller?.querySelector<HTMLElement>(`[href="#${activeId}"]`)
    if (!scroller || !link) {
      return
    }
    // Centers it, within the links' own scroll only: `scrollIntoView` would
    // also stop the page's smooth scroll to the section.
    scroller.scrollTo({
      left: link.offsetLeft - (scroller.clientWidth - link.offsetWidth) / 2,
    })
  }, [activeId])

  return (
    <nav
      aria-label="Contents bar"
      className={barVariants({ shown })}
      data-testid="contents-bar">
      <div className="mx-auto flex h-full max-w-4xl items-center gap-2 px-3 sm:px-5">
        <ContentsMenu activeId={activeId} shown={shown} />
        <div
          ref={scrollerRef}
          className={cn(
            // The links' offsets are measured from it, to scroll one to center.
            'relative min-w-0 flex-1 overflow-x-auto scroll-smooth',
            // Room for a link's focus ring, which the scroll would clip.
            'p-1',
            // No scrollbar: the link faded out at the edge shows there's more.
            '[scrollbar-width:none] mask-x-from-[calc(100%-1rem)]'
          )}>
          {/* Centered while they fit, and from the start once they don't. */}
          <List className="mx-auto flex w-max gap-2">
            {CONTENTS_ENTRIES.map((entry) => (
              <ContentsLink
                key={entry.title}
                {...entry}
                current={entry.sectionId === activeId}
                data-testid="contents-bar-link"
              />
            ))}
          </List>
        </div>
      </div>
    </nav>
  )
}
