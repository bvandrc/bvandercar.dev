import { useId } from 'react'

import { cn } from '@/utils'

export type SectionProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  'title' | 'children'
> & {
  emoji: string
  title: string
  /** `h2` for a page section, `h3` for a group within one. */
  level?: 'h2' | 'h3'
  children: React.ReactNode
}

const HEADING_CLASSES = {
  h2: 'text-2xl font-semibold tracking-tight',
  h3: 'text-lg font-semibold',
} satisfies Record<NonNullable<SectionProps['level']>, string>

type Logo = {
  /** Simple Icons slug */
  slug: string
  /** Brand color, as hex without the `#` */
  color: string
}

/**
 * Emoji drawn as a brand logo instead.
 *
 * Keyed by the emoji the profile content uses, which the GitHub README keeps.
 */
const EMOJI_LOGOS: Partial<Record<string, Logo>> = {
  '⚛️': { slug: 'react', color: '61DAFB' },
}

/** A heading's emoji, or the brand logo that stands in for it; decorative either way. */
const HeadingMark = ({ emoji }: { emoji: string }) => {
  const logo = EMOJI_LOGOS[emoji]
  if (!logo) {
    return <span aria-hidden="true">{emoji}</span>
  }
  return (
    <img
      src={`https://cdn.simpleicons.org/${logo.slug}/${logo.color}`}
      alt=""
      className="size-[1em]"
    />
  )
}

/** A titled section, labelled by its own heading. */
export const Section = ({
  emoji,
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
        <HeadingMark emoji={emoji} />
        <span>{title}</span>
        <HeadingMark emoji={emoji} />
      </Heading>
      {children}
    </section>
  )
}
