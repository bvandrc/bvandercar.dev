import type { UiIconName } from '@/lib/icons'
import { GITHUB_OWNER, GITHUB_PROFILE_URL } from '~/github'
import { Icon } from './primitives/Icon'
import { Link, type LinkProps } from './primitives/Link'
import { Tooltip } from './primitives/Tooltip'

type SocialLinkProps = Pick<LinkProps, 'href' | 'tone'> & {
  /** The tooltip, naming the profile the link goes to. */
  tooltip: string
  /** The site's logo, shown before the text at its size, in the link's own color. */
  icon: UiIconName
  children: React.ReactNode
}

/** A link to one of my profiles on another site, with that site's logo. */
const SocialLink = ({
  href,
  tone,
  tooltip,
  icon,
  children,
}: SocialLinkProps) => (
  <Tooltip content={tooltip}>
    <Link
      href={href}
      tone={tone}
      newTab
      className="inline-flex items-center gap-2">
      <Icon name={icon} />
      {children}
    </Link>
  </Tooltip>
)

type SocialLinksProps = Pick<SocialLinkProps, 'tone'>

/** Links to my GitHub and LinkedIn profiles, laid out by the row they're placed in. */
export const SocialLinks = ({ tone }: SocialLinksProps) => (
  <>
    <SocialLink
      href={GITHUB_PROFILE_URL}
      tone={tone}
      tooltip="GitHub Profile"
      icon="simple-icons:github">
      github.com/{GITHUB_OWNER}
    </SocialLink>
    <SocialLink
      href="https://www.linkedin.com/in/blake-vandercar"
      tone={tone}
      tooltip="LinkedIn Profile"
      icon="simple-icons:linkedin">
      LinkedIn
    </SocialLink>
  </>
)
