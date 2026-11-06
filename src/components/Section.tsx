import { useId } from 'react'

import type { SectionLogo } from '@/generated/profile/content/projects'
import type { GroupGlyph } from '@/generated/profile/content/sections'
import type { GlyphName } from '@/lib/icons'
import { cn } from '@/utils'
import { BrandIcon } from './primitives/BrandIcon'
import { Icon } from './primitives/Icon'

type TitledSectionProps = Omit<
  React.ComponentProps<'section'>,
  'title' | 'children'
> & {
  level: 'h2' | 'h3'
  /** The heading's type, and any spacing that differs from the default. */
  headingClassName: string
  /** Classes for the title's own box, between the two icons. */
  titleClassName?: string
  /** Drawn on both sides of the title, and decorative. */
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

/** A section labelled by its own heading, which shows the icon on both sides. */
const TitledSection = ({
  level: Heading,
  headingClassName,
  titleClassName,
  icon,
  title,
  children,
  ...props
}: TitledSectionProps) => {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} {...props}>
      <Heading
        id={headingId}
        className={cn(
          'flex items-center justify-center gap-3',
          headingClassName
        )}>
        {icon}
        <span className={titleClassName}>{title}</span>
        {icon}
      </Heading>
      {children}
    </section>
  )
}

/** What `Section` and `SubSection` both take: everything but what each sets itself. */
type SectionPropsCommon = Omit<
  TitledSectionProps,
  'level' | 'headingClassName' | 'titleClassName' | 'icon'
>

export type SectionProps = SectionPropsCommon & {
  glyph: GlyphName
}

/** A top-level page section: an h2 with an interface glyph in the site's orange. */
export const Section = ({ glyph, className, ...props }: SectionProps) => (
  <TitledSection
    level="h2"
    headingClassName="text-2xl font-semibold tracking-tight"
    titleClassName={cn(
      'flex items-center gap-3',
      // An orange rule from each icon to the title, padded by the gaps on both
      // its sides: 12px, a 36px line, and 12px make 60px from icon to text.
      "before:h-0.5 before:w-9 before:rounded-full before:bg-orange-400 before:content-['']",
      "after:h-0.5 after:w-9 after:rounded-full after:bg-orange-400 after:content-['']"
    )}
    icon={
      <Icon name={glyph} className="size-[1.25em] shrink-0 text-orange-400" />
    }
    className={cn('flex flex-col gap-5', className)}
    {...props}
  />
)

export type SubSectionProps = SectionPropsCommon & {
  /** An interface glyph in its own color, or a Simple Icons logo in its brand color. */
  icon: GroupGlyph | SectionLogo
}

/** A group heading's glyph in its color, or its brand logo. */
const SubSectionIcon = ({ icon }: Pick<SubSectionProps, 'icon'>) =>
  'name' in icon ? (
    <Icon
      name={icon.name}
      // SVG's own `color` attribute, which the CSP allows where an inline style isn't.
      color={`#${icon.color}`}
      className="size-[1.25em] shrink-0"
    />
  ) : (
    <BrandIcon
      slug={icon.slug}
      color={icon.color}
      // 1.25 of the h3's em, at the 1.125rem of `text-lg`; the class keeps it there.
      size={23}
      className="size-[1.25em]"
    />
  )

/** A group within a section: an h3 with a colored glyph or a brand logo. */
export const SubSection = ({ icon, className, ...props }: SubSectionProps) => (
  <TitledSection
    level="h3"
    headingClassName="text-lg font-semibold"
    icon={<SubSectionIcon icon={icon} />}
    className={cn('flex flex-col gap-3', className)}
    {...props}
  />
)
