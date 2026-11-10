import { Popover as RadixPopover } from 'radix-ui'

import { cn } from '@/lib/cn'

export type PopoverProps = Pick<
  React.ComponentProps<typeof RadixPopover.Root>,
  'open' | 'onOpenChange'
> &
  Pick<
    React.ComponentProps<typeof RadixPopover.Content>,
    'aria-label' | 'className' | 'onCloseAutoFocus'
  > & {
    /** What it shows while open. */
    content: React.ReactNode
    /** The trigger: one element that takes a ref and spreads its props, like a `button`. */
    children: React.ReactElement
    'data-testid'?: string
  }

/**
 * A panel its trigger opens and closes, below it, which Escape or a press
 * outside it also closes.
 *
 * Moves focus into it on open, and back to the trigger on close.
 */
export const Popover = ({
  content,
  children,
  'aria-label': ariaLabel,
  className,
  open,
  onOpenChange,
  onCloseAutoFocus,
  'data-testid': testId,
}: PopoverProps) => (
  <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
    <RadixPopover.Trigger asChild>{children}</RadixPopover.Trigger>
    {/* Not portaled, unlike a tooltip: its content stays inside the landmark
        its trigger is in, as the links a popover tends to hold should. */}
    <RadixPopover.Content
      aria-label={ariaLabel}
      align="start"
      sideOffset={6}
      collisionPadding={8}
      onCloseAutoFocus={onCloseAutoFocus}
      className={cn(
        'z-50 animate-tooltip-in rounded-md border border-ink-muted/30 bg-surface-raised p-2 shadow-lg shadow-black/50',
        className
      )}
      data-testid={testId}>
      {content}
    </RadixPopover.Content>
  </RadixPopover.Root>
)
