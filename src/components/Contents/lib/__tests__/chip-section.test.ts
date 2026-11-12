import { getChipSectionId } from '../chip-section'

type Entries = Parameters<typeof getChipSectionId>[0]

/** Two sections with chips, each followed by one without. */
const ENTRIES = [
  { sectionId: 'first' },
  { sectionId: 'under-first' },
  { sectionId: 'second' },
  { sectionId: 'under-second' },
] satisfies Entries

const CHIPS = [
  { sectionId: 'first' },
  { sectionId: 'second' },
] satisfies Entries

describe('getChipSectionId', () => {
  it('gives a section with a chip its own', () => {
    for (const { sectionId } of CHIPS) {
      expect(getChipSectionId(ENTRIES, CHIPS, sectionId), sectionId).toBe(
        sectionId
      )
    }
  })

  it('gives a section without one the nearest chip above it', () => {
    const CASES = [
      ['under-first', 'first'],
      // Not the first chip, above the one before it.
      ['under-second', 'second'],
    ]
    for (const [sectionId, chipSectionId] of CASES) {
      expect(getChipSectionId(ENTRIES, CHIPS, sectionId), sectionId).toBe(
        chipSectionId
      )
    }
  })

  it('gives none above every chip', () => {
    expect(
      getChipSectionId(ENTRIES, [{ sectionId: 'second' }], 'under-first')
    ).toBeUndefined()
  })

  it('gives none for no section, or one not listed', () => {
    for (const sectionId of [undefined, 'unlisted']) {
      expect(
        getChipSectionId(ENTRIES, CHIPS, sectionId),
        String(sectionId)
      ).toBeUndefined()
    }
  })
})
