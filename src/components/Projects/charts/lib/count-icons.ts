import { objectFromEntries } from 'ts-extras'

import { COUNT_KINDS } from '@/generated/profile/content/counts'

/** The glyph each count is shown with, by its key, the same as the profile badge's. */
export const COUNT_ICONS = objectFromEntries(
  COUNT_KINDS.map(({ key, icon }) => [key, icon])
)
