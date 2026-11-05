import { useId } from 'react'
import { pick } from 'es-toolkit'
import type { MergeExclusive } from 'type-fest'

import type { SectionLogo } from '@/generated/profile/content/projects'
import type { GlyphName } from '@/lib/icons'
import { cn } from '@/utils'
import { BrandIcon } from './primitives/BrandIcon'
import { Icon } from './primitives/Icon'

/** A heading's icon, shown on both sides of its title. */
type HeadingIconProps = MergeExclusive<
  /** An emoji, or a Simple Icons logo in its brand color. */
  { icon: string | SectionLogo },
  /** An interface glyph, in the site's orange. */
  { glyph: GlyphName }
>

export type SectionProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  'title' | 'children'
> &
  HeadingIconProps & {
    title: string
    /** `h2` for a page section, `h3` for a group within one. */
    level?: 'h2' | 'h3'
    children: React.ReactNode
  }

const HEADING_CLASSES = {
  h2: 'text-2xl font-semibold tracking-tight',
  h3: 'text-lg font-semibold',
} satisfies Record<NonNullable<SectionProps['level']>, string>

/** A heading's glyph, emoji, or brand logo; decorative either way. */
const HeadingIcon = ({ source }: { source: HeadingIconProps }) => {
  // Read off `source` rather than destructured, which keeps the union narrowing.
  if (source.glyph !== undefined) {
    return <Icon name={source.glyph} className="shrink-0 text-orange-400" />
  }
  if (typeof source.icon === 'string') {
    return <span aria-hidden="true">{source.icon}</span>
  }
  return (
    <BrandIcon
      {...pick(source.icon, ['slug', 'color'])}
      // The h2 em; the class matches the heading at either level.
      size={24}
      className="size-[1em]"
    />
  )
}

/** A titled section, labelled by its own heading. */
export const Section = (props: SectionProps) => {
  const {
    icon,
    glyph,
    title,
    level = 'h2',
    className,
    children,
    ...sectionProps
  } = props
  const headingId = useId()
  const Heading = level
  return (
    <section
      aria-labelledby={headingId}
      className={className ?? 'flex flex-col gap-5'}
      {...sectionProps}>
      <Heading
        id={headingId}
        className={cn(
          'flex items-center justify-center gap-3',
          HEADING_CLASSES[level]
        )}>
        <HeadingIcon source={props} />
        <span>{title}</span>
        <HeadingIcon source={props} />
      </Heading>
      {children}
    </section>
  )
}
