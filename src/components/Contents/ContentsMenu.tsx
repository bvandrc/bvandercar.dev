import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { Icon } from '../primitives/Icon'
import { List } from '../primitives/List'
import { Popover } from '../primitives/Popover'
import { CONTENTS_ENTRIES, ContentsLink } from './ContentsLink'

type ContentsMenuProps = {
  /** The id of the section in view, whose link it lights up. */
  activeId: string | undefined
  /** Whether the bar it's in is on screen; it closes once the bar isn't. */
  shown: boolean
}

/**
 * A chevron that opens every section as a list, under a link back to the top,
 * all in view at once where the bar's own row scrolls.
 *
 * Closes once a link in it is followed.
 */
export const ContentsMenu = ({ activeId, shown }: ContentsMenuProps) => {
  const [open, setOpen] = useState(false)
  // Set by a link, so focus stays where the link takes it, not on the chevron.
  const followedLinkRef = useRef(false)

  useEffect(() => {
    if (!shown) {
      setOpen(false)
    }
  }, [shown])

  const followLink = () => {
    followedLinkRef.current = true
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      aria-label="All sections"
      onCloseAutoFocus={(event) => {
        if (followedLinkRef.current) {
          followedLinkRef.current = false
          event.preventDefault()
        }
      }}
      content={
        <List className="flex flex-col gap-1.5">
          <ContentsLink
            // `#top` scrolls to the top of the page, with no element by that id.
            sectionId="top"
            title="Back to top"
            icon={<Icon name="arrow-up" className="size-4" />}
            className="w-full"
            onClick={followLink}
            data-testid="contents-bar-menu-top-link"
          />
          {CONTENTS_ENTRIES.map((entry) => (
            <ContentsLink
              key={entry.title}
              {...entry}
              current={entry.sectionId === activeId}
              className="w-full"
              onClick={followLink}
              data-testid="contents-bar-menu-link"
            />
          ))}
        </List>
      }
      data-testid="contents-bar-menu">
      <button
        type="button"
        aria-label="All sections"
        className={cn(
          'group flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-ink-muted',
          // Glows orange on hover, like the links beside it.
          'hover-glow-12 hover:text-accent'
        )}
        data-testid="contents-bar-menu-toggle">
        {/* Flips to point up while the list is open. */}
        <Icon
          name="chevron-down"
          className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </button>
    </Popover>
  )
}
