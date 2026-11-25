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
        'group/intro flex max-w-prose flex-col items-center gap-1 text-ink-muted sm:items-start',
        // A size down on a phone, so the intro takes fewer lines.
        'text-sm sm:text-base',
        // Evens out a line that wraps, rather than leaving one word on its own.
        'text-balance',
        'sm:[grid-area:intro]'
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
  <header
    className={cn(
      'flex flex-col items-center gap-3',
      // From sm, the portrait, with the links as icons below it, stands to the
      // left of the name and intro, so neither adds height above the projects.
      'sm:grid sm:grid-cols-[auto_auto] sm:justify-center sm:gap-x-8',
      // The portrait's rows fit it, level with the name's top, and the links
      // take the rest of the intro's height, centered in it.
      "sm:grid-rows-[auto_auto_1fr] sm:[grid-template-areas:'photo_name'_'photo_intro'_'links_intro']",
      // The name and intro line up on the portrait's side, as a profile's do.
      'sm:justify-items-start sm:text-left'
    )}
    data-testid="header">
    {/* On a phone, the portrait sits beside the name at its height; from sm,
        this row gives way, so its two take their own places in the grid. */}
    <div className="flex flex-wrap items-center justify-center gap-3 sm:contents">
      {/* Behind the photo, the accent, which shows faintly through it. */}
      <span className="size-10 overflow-hidden rounded-full bg-accent sm:size-32 sm:[grid-area:photo]">
        <img
          src={`${import.meta.env.BASE_URL}portrait.webp`}
          alt=""
          width={128}
          height={128}
          className={cn(
            'size-full',
            // A dim black and white, so it sits back on the dark page, letting
            // through just enough of the accent behind it to tint it.
            'brightness-80 contrast-115 grayscale opacity-92'
          )}
          data-testid="header-portrait"
        />
      </span>
      <h1
        className="text-3xl font-semibold tracking-tight sm:[grid-area:name]"
        data-testid="header-title">
        Blake Vandercar
      </h1>
    </div>
    <Intro />
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:gap-x-4 sm:justify-self-center sm:[grid-area:links]">
      <SocialLinks labels="hiddenFromSm" />
    </div>
  </header>
)
