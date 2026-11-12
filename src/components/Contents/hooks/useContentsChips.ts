import { useIsMobile } from '@bvandrc/react-toolkit'

import { CONTENTS_ENTRIES } from '../ContentsLink'

/** The viewport width, in px, from which the bar fits every chip without scrolling. */
const ALL_CHIPS_FROM = 900

const NARROW_CHIPS = CONTENTS_ENTRIES.filter(({ narrowChip }) => narrowChip)

/**
 * The sections with a chip, in the page's contents and the bar.
 *
 * Every one from 900px wide; below that, only those with a `narrowChip`, so
 * the bar scrolls less and the contents take fewer rows.
 */
export const useContentsChips = () =>
  useIsMobile(ALL_CHIPS_FROM) ? NARROW_CHIPS : CONTENTS_ENTRIES
