import { pickActiveSection, type SectionBounds } from '../pick-active-section'

const LANDING = 72
const SLACK = 48
const VIEWPORT_HEIGHT = 800

/**
 * Three sections a 40px gap apart, scrolled up by `scrolled` px, each landed
 * at `LANDING`: so each is reached once its top is 120px down.
 */
const buildSections = (scrolled: number): SectionBounds[] =>
  [
    { id: 'first', top: 200, bottom: 600 },
    { id: 'second', top: 640, bottom: 760 },
    { id: 'last', top: 800, bottom: 1000 },
  ].map(({ id, top, bottom }) => ({
    id,
    top: top - scrolled,
    bottom: bottom - scrolled,
    landing: LANDING,
  }))

const pick = (sections: readonly SectionBounds[], atBottom = false) =>
  pickActiveSection(sections, {
    slack: SLACK,
    viewportHeight: VIEWPORT_HEIGHT,
    atBottom,
  })

const pickScrolled = (scrolled: number, atBottom = false) =>
  pick(buildSections(scrolled), atBottom)

describe('pickActiveSection', () => {
  it('picks the last section whose top is within the slack of its landing spot', () => {
    const CASES = [
      // Its top right at 120px.
      [80, 'first'],
      [400, 'first'],
      // The next one's top just past it.
      [521, 'second'],
      [700, 'last'],
    ] as const
    for (const [scrolled, expected] of CASES) {
      expect(pickScrolled(scrolled), String(scrolled)).toBe(expected)
    }
  })

  it('picks none before the first section is reached', () => {
    expect(pickScrolled(79)).toBeUndefined()
  })

  it('keeps the section above through the gap before the next', () => {
    // The first's bottom is past 120px, the second's top not yet.
    expect(pickScrolled(500)).toBe('first')
  })

  it("picks none once the last section's bottom has passed 120px", () => {
    expect(pickScrolled(881)).toBeUndefined()
  })

  it('picks the last section in view once the page scrolls no further', () => {
    // Its top is still well below 120px, which it can never reach.
    expect(pickScrolled(300, true)).toBe('last')
  })

  it('measures each section from its own landing spot', () => {
    const SECTIONS = buildSections(500).map((section) =>
      // Landed 40px lower, so reached 40px sooner: its top is at 140px.
      section.id === 'second' ? { ...section, landing: LANDING + 40 } : section
    )
    expect(pick(SECTIONS)).toBe('second')
  })

  it('picks none for no sections', () => {
    expect(pick([])).toBeUndefined()
  })
})
