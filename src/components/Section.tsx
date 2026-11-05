import { useId } from 'react'
import type { MergeExclusive } from 'type-fest'

import type { SectionLogo } from '@/generated/profile/content/projects'
import type { GlyphName } from '@/lib/icons'
import { cn } from '@/utils'
import { BrandIcon } from './primitives/BrandIcon'
import { Icon } from './primitives/Icon'

/** A heading's mark, shown on both sides of its title. */
type HeadingMarkProps = MergeExclusive<
  /** An emoji, or a Simple Icons logo in its brand color. */
  { icon: string | SectionLogo },
  /** An interface glyph, in the site's orange. */
  { glyph: GlyphName }
>

export type SectionProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  'title' | 'children'
> &
  HeadingMarkProps & {
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
const HeadingMark = ({ mark }: { mark: HeadingMarkProps }) => {
  // Read off `mark` rather than destructured, which keeps the union narrowing.
  if (mark.glyph !== undefined) {
    return <Icon name={mark.glyph} className="shrink-0 text-orange-400" />
  }
  if (typeof mark.icon === 'string') {
    return <span aria-hidden="true">{mark.icon}</span>
  }
  return (
    <BrandIcon
      slug={mark.icon.slug}
      color={mark.icon.color}
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
        <HeadingMark mark={props} />
        <span>{title}</span>
        <HeadingMark mark={props} />
      </Heading>
      {children}
    </section>
  )
}
