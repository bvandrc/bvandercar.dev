import { buildMailtoHref } from '@bvandrc/react-toolkit'
import { cva, type VariantProps } from 'class-variance-authority'

import type { UiIconName } from '@/lib/icons'
import { GITHUB_PROFILE_URL } from '~/github'
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

const socialLinkVariants = cva('inline-flex items-center gap-2', {
  variants: {
    labels: {
      shown: '',
      // Its icon alone, at a size that reads, and taps, without the label.
      hiddenFromSm: 'sm:text-2xl',
    },
  },
  defaultVariants: { labels: 'shown' },
})

const labelVariants = cva('', {
  variants: {
    // Hidden, the label still names the link to a screen reader.
    labels: { shown: '', hiddenFromSm: 'sm:sr-only' },
  },
  defaultVariants: { labels: 'shown' },
})

type SocialLinkProps = Pick<LinkProps, 'href' | 'tone' | 'newTab'> &
  VariantProps<typeof socialLinkVariants> & {
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
  labels,
  children,
  ...linkProps
}: SocialLinkProps) => (
  <Tooltip content={tooltip}>
    <Link {...linkProps} className={socialLinkVariants({ labels })}>
      <Icon name={icon} />
      <span className={labelVariants({ labels })}>{children}</span>
    </Link>
  </Tooltip>
)

type SocialLinksProps = Pick<SocialLinkProps, 'tone' | 'labels'>

/**
 * Links to my GitHub and LinkedIn profiles and my email, laid out by the row they're placed in.
 *
 * `labels: 'hiddenFromSm'` shows them from sm as larger icons alone, named by their tooltips.
 */
export const SocialLinks = ({ tone, labels }: SocialLinksProps) => (
  <>
    <SocialLink
      href={GITHUB_PROFILE_URL}
      tone={tone}
      labels={labels}
      newTab
      tooltip="GitHub Profile"
      icon="simple-icons:github">
      GitHub
    </SocialLink>
    <SocialLink
      href="https://www.linkedin.com/in/blake-vandercar"
      tone={tone}
      labels={labels}
      newTab
      tooltip="LinkedIn Profile"
      icon="simple-icons:linkedin">
      LinkedIn
    </SocialLink>
    <SocialLink
      href={EMAIL_HREF}
      tone={tone}
      labels={labels}
      tooltip="Email Me"
      icon="mail">
      Email
    </SocialLink>
  </>
)
