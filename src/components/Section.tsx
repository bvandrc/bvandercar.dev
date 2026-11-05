import { useId } from 'react'

import type { SectionLogo } from '@/generated/profile/content/projects'
import type { GlyphName } from '@/lib/icons'
import { cn } from '@/utils'
import { BrandIcon } from './primitives/BrandIcon'
import { Icon } from './primitives/Icon'

/** An interface glyph for a heading, drawn in the site's orange. */
export type SectionGlyph = { glyph: GlyphName }

export type SectionProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  'title' | 'children'
> & {
  /** An emoji, a Simple Icons logo in its brand color, or an orange glyph, shown on both sides. */
  icon: string | SectionLogo | SectionGlyph
  title: string
  /** `h2` for a page section, `h3` for a group within one. */
  level?: 'h2' | 'h3'
  children: React.ReactNode
}

const HEADING_CLASSES = {
  h2: 'text-2xl font-semibold tracking-tight',
  h3: 'text-lg font-semibold',
} satisfies Record<NonNullable<SectionProps['level']>, string>

/** A heading's emoji, glyph, or brand logo; decorative either way. */
const HeadingMark = ({ icon }: { icon: SectionProps['icon'] }) => {
  if (typeof icon === 'string') {
    return <span aria-hidden="true">{icon}</span>
  }
  if ('glyph' in icon) {
    return <Icon name={icon.glyph} className="shrink-0 text-orange-400" />
  }
  return (
    <BrandIcon
      slug={icon.slug}
      color={icon.color}
      // The h2 em; the class matches the heading at either level.
      size={24}
      className="size-[1em]"
    />
  )
}

/** A titled section, labelled by its own heading. */
export const Section = ({
  icon,
  title,
  level = 'h2',
  className,
  children,
  ...props
}: SectionProps) => {
  const headingId = useId()
  const Heading = level
  return (
    <section
      aria-labelledby={headingId}
      className={className ?? 'flex flex-col gap-5'}
      {...props}>
      <Heading
        id={headingId}
        className={cn(
          'flex items-center justify-center gap-3',
          HEADING_CLASSES[level]
        )}>
        <HeadingMark icon={icon} />
        <span>{title}</span>
        <HeadingMark icon={icon} />
      </Heading>
      {children}
    </section>
  )
}
