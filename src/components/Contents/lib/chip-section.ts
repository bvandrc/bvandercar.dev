import type { ContentsEntry } from '../ContentsLink'

type SectionEntry = Pick<ContentsEntry, 'sectionId'>

/**
 * The section whose chip stands for `sectionId`, of `entries` in page order:
 * its own, where it's one of `chips`, or else the nearest above it that is.
 *
 * `undefined` for no section, or one above every chip.
 */
export const getChipSectionId = (
  entries: readonly SectionEntry[],
  chips: readonly SectionEntry[],
  sectionId: string | undefined
) => {
  const chipIds = new Set(chips.map((chip) => chip.sectionId))
  const index = entries.findIndex((entry) => entry.sectionId === sectionId)
  // Not found is -1, which slices to none.
  return entries
    .slice(0, index + 1)
    .findLast((entry) => chipIds.has(entry.sectionId))?.sectionId
}
