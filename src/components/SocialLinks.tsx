import { buildMailtoHref } from '@bvandrc/react-toolkit'

import type { UiIconName } from '@/lib/icons'
import { GITHUB_OWNER, GITHUB_PROFILE_URL } from '~/github'
import { Icon } from './primitives/Icon'
import { Link, type LinkProps } from './primitives/Link'
import { Tooltip } from './primitives/Tooltip'

/** My email, with a subject that says the sender found it here. */
const EMAIL_HREF = buildMailtoHref({
  // blake@bvandercar.dev, decoded at runtime so scrapers don't find it whole in the bundle. A
  // minifier would fold a plain join of its parts back into the address.
  to: atob('Ymxha2VAYnZhbmRlcmNhci5kZXY='),
  subject: 'From bvandercar.dev',
})

type SocialLinkProps = Pick<LinkProps, 'href' | 'tone' | 'newTab'> & {
  'data-testid'?: string
  /** The tooltip, naming where the link goes. */
  tooltip: string
  /** The site's logo, shown before the text at its size, in the link's own color. */
  icon: UiIconName
  children: React.ReactNode
}

/** A link to one of my profiles, or my email, with its logo. */
const SocialLink = ({
  tooltip,
  icon,
  children,
  ...linkProps
}: SocialLinkProps) => (
  <Tooltip content={tooltip}>
    <Link {...linkProps} className="inline-flex items-center gap-2">
      <Icon name={icon} />
      {children}
    </Link>
  </Tooltip>
)

type SocialLinksProps = Pick<SocialLinkProps, 'tone'>

/** Links to my GitHub and LinkedIn profiles and my email, laid out by the row they're placed in. */
export const SocialLinks = ({ tone }: SocialLinksProps) => (
  <>
    <SocialLink
      href={GITHUB_PROFILE_URL}
      tone={tone}
      newTab
      tooltip="GitHub Profile"
      icon="simple-icons:github">
      github.com/{GITHUB_OWNER}
    </SocialLink>
    <SocialLink
      href="https://www.linkedin.com/in/blake-vandercar"
      tone={tone}
      newTab
      tooltip="LinkedIn Profile"
      icon="simple-icons:linkedin">
      LinkedIn
    </SocialLink>
    <SocialLink
      href={EMAIL_HREF}
      tone={tone}
      tooltip="Email Me"
      icon="mail"
      data-testid="social-links-email">
      Email
    </SocialLink>
  </>
)
