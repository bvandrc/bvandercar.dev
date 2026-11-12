import { useState } from 'react'
import { TAILWIND_BREAKPOINTS, useIsMobile } from '@bvandrc/react-toolkit'
import { Collapsible } from 'radix-ui'

import { INTRO_LINES } from '@/generated/profile/content/about'
import { cn } from '@/lib/cn'
import { Icon } from './primitives/Icon'
import { SocialLinks } from './SocialLinks'

/** How many of the intro's lines a phone shows before "More about me". */
const PHONE_INTRO_LINES = 2

/**
 * The intro, a line per paragraph.
 *
 * Below sm, only its first lines show, with a toggle for the rest, so the
 * projects start nearer the top of a phone's screen.
 */
const Intro = () => {
  const isPhone = useIsMobile(TAILWIND_BREAKPOINTS.SM)
  const [expanded, setExpanded] = useState(false)
  return (
    <Collapsible.Root
      open={!isPhone || expanded}
      onOpenChange={setExpanded}
      className={cn(
        'group/intro flex max-w-prose flex-col items-center gap-1 text-ink-muted',
        // A size down on a phone, so the intro takes fewer lines.
        'text-sm sm:text-base',
        // Evens out a line that wraps, rather than leaving one word on its own.
        'text-balance'
      )}
      data-testid="header-tagline">
      {INTRO_LINES.slice(0, PHONE_INTRO_LINES).map((line) => (
        <p key={line}>{line}</p>
      ))}
      {/* Collapses by its grid row, which, unlike the height Radix measures,
          animates both ways without unmounting the lines. It's this wrapper
          that animates, since Radix zeroes a force-mounted Content's own
          transition. */}
      <div
        className={cn(
          'grid w-full transition-[grid-template-rows,visibility] duration-300 ease-out',
          'grid-rows-[1fr]',
          // Collapsed, and with it out of screen readers and the tab order.
          'group-data-[state=closed]/intro:invisible group-data-[state=closed]/intro:grid-rows-[0fr]'
        )}
        data-testid="header-intro-more">
        {/* Kept in the page while collapsed, for search engines, which read it
            at a phone's width. */}
        <Collapsible.Content
          forceMount
          className="flex min-h-0 flex-col gap-1 overflow-hidden">
          {INTRO_LINES.slice(PHONE_INTRO_LINES).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </Collapsible.Content>
      </div>
      {isPhone && (
        <Collapsible.Trigger
          className={cn(
            'group inline-flex items-center gap-1 text-accent hover:text-accent-hover',
            // A hand, like a link's, which Tailwind leaves off buttons.
            'cursor-pointer'
          )}
          data-testid="header-intro-toggle">
          {expanded ? 'Less' : 'More about me'}
          <Icon
            name="chevron-down"
            className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </Collapsible.Trigger>
      )}
    </Collapsible.Root>
  )
}

export const Header = () => (
  <header className="flex flex-col items-center gap-3" data-testid="header">
    <div className="flex flex-wrap items-center justify-center gap-3">
      <img
        src={`${import.meta.env.BASE_URL}logo.svg`}
        alt=""
        width={40}
        height={40}
        className="size-10"
        data-testid="header-logo"
      />
      <h1
        className="text-3xl font-semibold tracking-tight"
        data-testid="header-title">
        Blake Vandercar
      </h1>
    </div>
    <Intro />
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      <SocialLinks />
    </div>
  </header>
)
