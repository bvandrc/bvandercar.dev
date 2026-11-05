import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils'

const linkVariants = cva('', {
  variants: {
    tone: {
      accent: 'text-accent hover:text-accent-hover',
      muted: 'text-ink-muted hover:text-accent',
    },
  },
  defaultVariants: { tone: 'accent' },
})

export type LinkProps = React.ComponentProps<'a'> &
  VariantProps<typeof linkVariants> & {
    /** Opens in a new tab, with the `rel` that goes with it, and says so to screen readers. */
    newTab?: boolean
  }

/** A themed link. */
export const Link = ({
  tone,
  newTab = false,
  className,
  children,
  ...props
}: LinkProps) => (
  <a
    {...(newTab && { target: '_blank', rel: 'noopener noreferrer' })}
    className={cn(linkVariants({ tone }), className)}
    {...props}>
    {children}
    {newTab && <span className="sr-only"> (opens in a new tab)</span>}
  </a>
)
