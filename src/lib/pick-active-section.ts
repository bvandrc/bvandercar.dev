/** Where a section sits in the viewport, in px from its top. */
export type SectionBounds = {
  id: string
  top: number
  bottom: number
}

type PickActiveSectionOptions = {
  /** How far down the viewport a section's top must reach for the reader to be in it. */
  line: number
  /** The viewport's height. */
  viewportHeight: number
  /** Whether the page is scrolled as far down as it goes. */
  atBottom: boolean
}

/**
 * The id of the section the reader is in, of `sections` in page order: the
 * last whose top has scrolled up past `line`.
 *
 * Once the page can scroll no further, the last whose top has come into view
 * instead, so one too near the end to reach `line` still gets its turn. None
 * before the first, or past the bottom of the last.
 */
export const pickActiveSection = (
  sections: readonly SectionBounds[],
  { line, viewportHeight, atBottom }: PickActiveSectionOptions
) => {
  const reachedBy = atBottom ? viewportHeight : line
  const active = sections.findLast(({ top }) => top <= reachedBy)
  // Only past the last one does its bottom end it: between two, the gap still
  // belongs to the one above.
  if (
    active === undefined ||
    (active === sections.at(-1) && active.bottom < line)
  ) {
    return undefined
  }
  return active.id
}
