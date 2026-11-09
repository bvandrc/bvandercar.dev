import { Slot } from 'radix-ui'

import { cn } from '@/lib/cn'

export type BadgeProps = React.ComponentProps<'span'> & {
  /** Styles its one child, like a link, in place of rendering a `span`. */
  asChild?: boolean
}

/** A small bordered chip: an icon and a short label, like a skill's. */
export const Badge = ({ asChild = false, className, ...props }: BadgeProps) => {
  const Element = asChild ? Slot.Root : 'span'
  return (
    <Element
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-sm',
        className
      )}
      {...props}
    />
  )
}
