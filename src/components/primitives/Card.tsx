import { cn } from '@/lib/cn'

/** Elements a click on goes to themselves, rather than to the card around them. */
const CONTROLS = 'a, button, input, select, textarea, label, summary'

export type CardProps = React.ComponentProps<'div'> & {
  /**
   * Called for a click on the card's own surface.
   *
   * Not for one on a link, button, or other control inside it, nor one that
   * ends a text selection. The cursor stays as is, so it suits a shortcut to
   * something a control in the card also does, not the only way to do it.
   */
  onSurfaceClick?: () => void
}

/** A bordered panel that groups related content. */
export const Card = ({
  onSurfaceClick,
  onClick,
  className,
  ...props
}: CardProps) => (
  // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: onSurfaceClick only shortcuts a control inside the card, which keyboards reach instead.
  <div
    onClick={(event) => {
      onClick?.(event)
      const control =
        event.target instanceof Element ? event.target.closest(CONTROLS) : null
      if (
        onSurfaceClick &&
        // A control around the whole card doesn't count: the click is still on its surface.
        !(control && event.currentTarget.contains(control)) &&
        // A drag that selected text ends in a click too.
        (window.getSelection()?.isCollapsed ?? true)
      ) {
        onSurfaceClick()
      }
    }}
    className={cn('rounded-xl border border-border bg-surface p-5', className)}
    {...props}
  />
)
