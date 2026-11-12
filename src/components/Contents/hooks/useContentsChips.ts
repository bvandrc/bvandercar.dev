import { useIsMobile } from '@bvandrc/react-toolkit'

import { CONTENTS_ENTRIES } from '../ContentsLink'

/** The viewport width, in px, from which the bar fits every chip without scrolling. */
const ALL_CHIPS_FROM = 900

const REDUCED_CHIPS = CONTENTS_ENTRIES.filter(
  ({ inReducedContents }) => inReducedContents
)

/**
 * The sections with a chip, in the page's contents and the bar.
 *
 * Every one from 900px wide; below that, only those `inReducedContents`, so
 * the bar scrolls less and the contents take fewer rows.
 */
export const useContentsChips = () =>
  useIsMobile(ALL_CHIPS_FROM) ? REDUCED_CHIPS : CONTENTS_ENTRIES
