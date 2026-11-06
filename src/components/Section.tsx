import { useId } from 'react'

import type { SectionLogo } from '@/generated/profile/content/projects'
import type {
  GlyphColor,
  GroupGlyph,
} from '@/generated/profile/content/sections'
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
    headingClassName="gap-4 text-2xl font-semibold tracking-tight"
    icon={
      <Icon name={glyph} className="size-[1.25em] shrink-0 text-orange-400" />
    }
    className={cn('flex flex-col gap-5', className)}
    {...props}
  />
)

// Each written out in full so Tailwind generates it, since the names come from content.
const GLYPH_COLOR_CLASSES = {
  amber: 'text-amber-400',
  brown: 'text-[#a7723d]',
  green: 'text-green-400',
  sky: 'text-sky-400',
  violet: 'text-violet-300',
  yellow: 'text-yellow-300',
} satisfies Record<GlyphColor, string>

export type SubSectionProps = SectionPropsCommon & {
  /** An interface glyph in its own color, or a Simple Icons logo in its brand color. */
  icon: GroupGlyph | SectionLogo
}

/** A group heading's glyph in its color, or its brand logo. */
const SubSectionIcon = ({ icon }: Pick<SubSectionProps, 'icon'>) => {
  if ('name' in icon) {
    return (
      <Icon
        name={icon.name}
        className={cn('shrink-0', GLYPH_COLOR_CLASSES[icon.color])}
      />
    )
  }
  return (
    <BrandIcon
      slug={icon.slug}
      color={icon.color}
      // The h3's em, at the 1.125rem of `text-lg`; the class keeps it there.
      size={18}
      className="size-[1em]"
    />
  )
}

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
