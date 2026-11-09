import { INTRO_LINES } from '@/generated/profile/content/about'
import { cn } from '@/lib/cn'
import { SocialLinks } from './SocialLinks'

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
    <div
      className={cn(
        'flex max-w-prose flex-col items-center gap-1 text-ink-muted',
        // A size down on a phone, so the intro takes fewer lines.
        'text-sm sm:text-base',
        // Evens out a line that wraps, rather than leaving one word on its own.
        'text-balance'
      )}
      data-testid="header-tagline">
      {INTRO_LINES.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
    <SocialLinks />
  </header>
)
