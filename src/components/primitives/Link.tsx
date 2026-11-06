import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils'

const linkVariants = cva('', {
  variants: {
    tone: {
      accent: 'text-accent hover:text-accent-hover',
      muted: 'text-ink-muted hover:text-accent',
      violet: 'text-link-violet hover:text-accent-hover',
    },
  },
  defaultVariants: { tone: 'accent' },
})

export type LinkProps = React.ComponentProps<'a'> &
  VariantProps<typeof linkVariants> & {
    /** Opens in a new tab, with the `rel` that goes with it. */
    newTab?: boolean
  }

/** A themed link. */
export const Link = ({
  tone,
  newTab = false,
  className,
  ...props
}: LinkProps) => (
  <a
    {...(newTab && { target: '_blank', rel: 'noopener noreferrer' })}
    className={cn(linkVariants({ tone }), className)}
    {...props}
  />
)
