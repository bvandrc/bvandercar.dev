import { useId } from 'react'

import type { SectionLogo } from '@/generated/profile/content/types'
import { cn } from '@/utils'
import { SimpleIcon } from './SimpleIcon'

export type SectionProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  'title' | 'children'
> & {
  /** An emoji, or a Simple Icons logo in its brand color, shown on both sides. */
  icon: string | SectionLogo
  title: string
  /** `h2` for a page section, `h3` for a group within one. */
  level?: 'h2' | 'h3'
  children: React.ReactNode
}

const HEADING_CLASSES = {
  h2: 'text-2xl font-semibold tracking-tight',
  h3: 'text-lg font-semibold',
} satisfies Record<NonNullable<SectionProps['level']>, string>

/** A heading's emoji, or the brand logo in its place; decorative either way. */
const HeadingMark = ({ icon }: { icon: SectionProps['icon'] }) =>
  typeof icon === 'string' ? (
    <span aria-hidden="true">{icon}</span>
  ) : (
    <SimpleIcon slug={icon.slug} color={icon.color} className="size-[1em]" />
  )

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
