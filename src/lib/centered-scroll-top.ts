/** Where an element sits on screen, in viewport px. */
export type ElementBounds = Pick<DOMRect, 'top' | 'bottom'>

export type CenteredScrollTopOptions = {
  /** How far the page is scrolled now, in px. */
  scrollY: number
  /** How tall the screen is, in px. */
  viewportHeight: number
  /** How much of the screen's top a fixed bar covers, in px. */
  topInset: number
}

/**
 * The page scroll that centers an element in the screen below a fixed bar.
 *
 * One too tall to fit there lines its top up with the bar's bottom instead, so
 * its top, rather than its middle, stays in view.
 */
export const getCenteredScrollTop = (
  { top, bottom }: ElementBounds,
  { scrollY, viewportHeight, topInset }: CenteredScrollTopOptions
) => {
  const room = viewportHeight - topInset
  const gap = Math.max(0, (room - (bottom - top)) / 2)
  return scrollY + top - topInset - gap
}
