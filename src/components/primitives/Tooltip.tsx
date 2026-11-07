import { Tooltip as RadixTooltip } from 'radix-ui'

/** Delay before a hovered trigger shows its tooltip, in ms; Radix's 700 feels sluggish. */
const OPEN_DELAY = 150

/** Shares one open delay across every tooltip, so moving between triggers skips it. */
export const TooltipProvider = ({
  children,
}: {
  children: React.ReactNode
}) => (
  <RadixTooltip.Provider delayDuration={OPEN_DELAY}>
    {children}
  </RadixTooltip.Provider>
)

export type TooltipProps = Pick<
  React.ComponentProps<typeof RadixTooltip.Root>,
  'open' | 'onOpenChange'
> &
  Pick<React.ComponentProps<typeof RadixTooltip.Content>, 'aria-label'> & {
    /** What the tooltip says, which screen readers hear as the trigger's description. */
    content: React.ReactNode
    /** The trigger: one element that takes a ref and spreads its props, like `Link`. */
    children: React.ReactElement
  }

/**
 * A tooltip shown while its trigger is hovered or has keyboard focus.
 *
 * Needs a `TooltipProvider` above it. Pass `open` and `onOpenChange` to also
 * open it from somewhere other than its trigger.
 */
export const Tooltip = ({
  content,
  children,
  'aria-label': ariaLabel,
  ...rootProps
}: TooltipProps) => (
  <RadixTooltip.Root {...rootProps}>
    <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        // What screen readers hear in place of `content`, for content that
        // isn't all text, like a chart.
        aria-label={ariaLabel}
        sideOffset={3}
        collisionPadding={8}
        className="z-50 max-w-xs animate-tooltip-in rounded-md border border-ink-muted/30 bg-surface-raised px-2 py-1 text-xs break-words text-ink shadow-lg shadow-black/50"
        data-testid="tooltip">
        {content}
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  </RadixTooltip.Root>
)
