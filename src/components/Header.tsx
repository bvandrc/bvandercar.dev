import { INTRO_LINES } from '@/generated/profile/content/about'
import { GITHUB_ICON_SLUG } from '@/lib/icons'
import { Badge } from './primitives/Badge'
import { BrandIcon } from './primitives/BrandIcon'
import { Link } from './primitives/Link'
import { Tooltip } from './primitives/Tooltip'

// Matches the accent theme token in src/styles/index.css, as the link text does.
const GITHUB_ICON_COLOR = '22d3ee'

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
    <Badge
      tone="caution"
      className="animate-caution-pulse px-3 py-1 text-sm"
      data-testid="header-status">
      <span aria-hidden="true">🚧</span> Under construction{' '}
      <span aria-hidden="true">🚧</span>
    </Badge>
    <div
      className="flex max-w-prose flex-col items-center gap-1 text-ink-muted"
      data-testid="header-tagline">
      {INTRO_LINES.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
    <Tooltip content="GitHub Profile">
      <Link
        href="https://github.com/bvandrc"
        newTab
        className="inline-flex items-center gap-2"
        data-testid="header-github-link">
        <BrandIcon
          slug={GITHUB_ICON_SLUG}
          color={GITHUB_ICON_COLOR}
          size={16}
          className="size-4"
        />
        github.com/bvandrc
      </Link>
    </Tooltip>
  </header>
)
