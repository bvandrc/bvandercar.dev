/** Where a section sits in the viewport, in px from its top. */
export type SectionBounds = {
  id: string
  top: number
  bottom: number
  /** Where a link to it lands its top: under anything pinned there, and its own margin. */
  landing: number
}

type PickActiveSectionOptions = {
  /** How far below its landing spot a section's top may still be for the reader to be in it. */
  slack: number
  /** The viewport's height. */
  viewportHeight: number
  /** Whether the page is scrolled as far down as it goes. */
  atBottom: boolean
}

/**
 * The id of the section the reader is in, of `sections` in page order: the
 * last whose top has scrolled up to within `slack` px of where a link lands it.
 *
 * Once the page can scroll no further, the last whose top has come into view
 * instead, so one too near the end to scroll that far still gets its turn.
 * None before the first, or past the bottom of the last.
 */
export const pickActiveSection = (
  sections: readonly SectionBounds[],
  { slack, viewportHeight, atBottom }: PickActiveSectionOptions
) => {
  const active = sections.findLast(
    ({ top, landing }) => top <= (atBottom ? viewportHeight : landing + slack)
  )
  // Only past the last one does its bottom end it: between two, the gap still
  // belongs to the one above.
  if (
    active === undefined ||
    (active === sections.at(-1) && active.bottom < active.landing + slack)
  ) {
    return undefined
  }
  return active.id
}
