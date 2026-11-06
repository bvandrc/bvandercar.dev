import { useId } from 'react'

import type { SectionLogo } from '@/generated/profile/content/projects'
import type { GlyphName } from '@/lib/icons'
import { cn } from '@/utils'
import { BrandIcon } from './primitives/BrandIcon'
import { Icon } from './primitives/Icon'

type TitledSectionProps = Omit<
  React.ComponentProps<'section'>,
  'title' | 'children'
> & {
  level: 'h2' | 'h3'
  /** The heading's type size and weight. */
  headingClassName: string
  /** Drawn on both sides of the title, and decorative. */
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

/** A section labelled by its own heading, which shows the icon on both sides. */
const TitledSection = ({
  level: Heading,
  headingClassName,
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
        <span>{title}</span>
        {icon}
      </Heading>
      {children}
    </section>
  )
}

/** What `Section` and `SubSection` both take: everything but what each sets itself. */
type SectionPropsCommon = Omit<
  TitledSectionProps,
  'level' | 'headingClassName' | 'icon'
>

export type SectionProps = SectionPropsCommon & {
  glyph: GlyphName
}

/** A top-level page section: an h2 with an interface glyph in the site's orange. */
export const Section = ({ glyph, className, ...props }: SectionProps) => (
  <TitledSection
    level="h2"
    headingClassName="text-2xl font-semibold tracking-tight"
    icon={<Icon name={glyph} className="shrink-0 text-orange-400" />}
    className={cn('flex flex-col gap-5', className)}
    {...props}
  />
)

export type SubSectionProps = SectionPropsCommon & {
  /** An emoji, or a Simple Icons logo in its brand color. */
  icon: string | SectionLogo
}

/** A group within a section: an h3 with an emoji or a brand logo. */
export const SubSection = ({ icon, className, ...props }: SubSectionProps) => (
  <TitledSection
    level="h3"
    headingClassName="text-lg font-semibold"
    icon={
      typeof icon === 'string' ? (
        <span aria-hidden="true">{icon}</span>
      ) : (
        <BrandIcon
          slug={icon.slug}
          color={icon.color}
          // The h3's em, at the 1.125rem of `text-lg`; the class keeps it there.
          size={18}
          className="size-[1em]"
        />
      )
    }
    className={cn('flex flex-col gap-3', className)}
    {...props}
  />
)
