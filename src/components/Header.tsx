import { INTRO_LINES } from '@/generated/profile/content/about'
import type { UiIconName } from '@/lib/icons'
import { Badge } from './primitives/Badge'
import { Icon } from './primitives/Icon'
import { Link, type LinkProps } from './primitives/Link'
import { Tooltip } from './primitives/Tooltip'

type HeaderSocialLinkProps = Pick<LinkProps, 'href'> & {
  /** The tooltip, naming the profile the link goes to. */
  tooltip: string
  /** The site's logo, shown before the text in the link's own color. */
  icon: UiIconName
  children: React.ReactNode
}

/** A link to one of my profiles on another site, with that site's logo. */
const HeaderSocialLink = ({
  href,
  tooltip,
  icon,
  children,
}: HeaderSocialLinkProps) => (
  <Tooltip content={tooltip}>
    <Link href={href} newTab className="inline-flex items-center gap-2">
      <Icon name={icon} className="size-4" />
      {children}
    </Link>
  </Tooltip>
)

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
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      <HeaderSocialLink
        href="https://github.com/bvandrc"
        tooltip="GitHub Profile"
        icon="simple-icons:github">
        github.com/bvandrc
      </HeaderSocialLink>
      <HeaderSocialLink
        href="https://www.linkedin.com/in/blake-vandercar"
        tooltip="LinkedIn Profile"
        icon="simple-icons:linkedin">
        LinkedIn
      </HeaderSocialLink>
    </div>
  </header>
)
