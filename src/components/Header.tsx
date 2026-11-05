import { INTRO_LINES } from '@/generated/profile/content/about'
import { Badge } from './primitives/Badge'

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
      <Badge tone="caution" data-testid="header-status">
        <span aria-hidden="true">🚧</span> Under construction{' '}
        <span aria-hidden="true">🚧</span>
      </Badge>
    </div>
    <div
      className="flex max-w-prose flex-col items-center gap-1 text-ink-muted"
      data-testid="header-tagline">
      {INTRO_LINES.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  </header>
)
