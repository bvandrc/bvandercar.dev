import { useId } from 'react'

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
      <Heading id={headingId} className={HEADING_CLASSES[level]}>
        <span aria-hidden="true">{emoji}</span> {title}
      </Heading>
      {children}
    </section>
  )
}
