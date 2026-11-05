import { Tooltip as RadixTooltip } from 'radix-ui'

/** Delay before a hovered trigger shows its tooltip, in ms; Radix's 700 feels sluggish. */
const OPEN_DELAY = 300

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

export type TooltipProps = {
  /** What the tooltip says, which screen readers hear as the trigger's description. */
  content: React.ReactNode
  /** The trigger: one element that takes a ref and spreads its props, like `Link`. */
  children: React.ReactElement
}

/**
 * A tooltip shown while its trigger is hovered or has keyboard focus.
 *
 * Needs a `TooltipProvider` above it.
 */
export const Tooltip = ({ content, children }: TooltipProps) => (
  <RadixTooltip.Root>
    <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        sideOffset={6}
        collisionPadding={8}
        className="z-50 max-w-xs animate-tooltip-in rounded-md border border-border bg-surface px-2 py-1 text-xs break-words text-ink shadow-lg"
        data-testid="tooltip">
        {content}
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  </RadixTooltip.Root>
)
