import { pickActiveSection, type SectionBounds } from '../pick-active-section'

/** Three sections a 40px gap apart, scrolled up by `scrolled` px. */
const buildSections = (scrolled: number): SectionBounds[] =>
  [
    { id: 'first', top: 200, bottom: 600 },
    { id: 'second', top: 640, bottom: 760 },
    { id: 'last', top: 800, bottom: 1000 },
  ].map(({ id, top, bottom }) => ({
    id,
    top: top - scrolled,
    bottom: bottom - scrolled,
  }))

const LINE = 120
const VIEWPORT_HEIGHT = 800

const pick = (scrolled: number, atBottom = false) =>
  pickActiveSection(buildSections(scrolled), {
    line: LINE,
    viewportHeight: VIEWPORT_HEIGHT,
    atBottom,
  })

describe('pickActiveSection', () => {
  it('picks the last section whose top has passed the line', () => {
    const CASES = [
      // Its top right on the line.
      [80, 'first'],
      [400, 'first'],
      // The next one's top just past it.
      [521, 'second'],
      [700, 'last'],
    ] as const
    for (const [scrolled, expected] of CASES) {
      expect(pick(scrolled), String(scrolled)).toBe(expected)
    }
  })

  it('picks none before the first section reaches the line', () => {
    expect(pick(79)).toBeUndefined()
  })

  it('keeps the section above through the gap before the next', () => {
    // The first's bottom is past the line, the second's top not yet.
    expect(pick(500)).toBe('first')
  })

  it('picks none once the last section has passed the line', () => {
    expect(pick(881)).toBeUndefined()
  })

  it('picks the last section in view once the page scrolls no further', () => {
    // Its top is still well below the line, which it can never reach.
    expect(pick(300, true)).toBe('last')
  })

  it('picks none for no sections', () => {
    expect(
      pickActiveSection([], {
        line: LINE,
        viewportHeight: VIEWPORT_HEIGHT,
        atBottom: false,
      })
    ).toBeUndefined()
  })
})
