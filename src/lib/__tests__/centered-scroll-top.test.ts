import { getCenteredScrollTop } from '../centered-scroll-top'

const SCROLL_Y = 1000
const VIEWPORT_HEIGHT = 800
const TOP_INSET = 48

const getScrollTop = (top: number, bottom: number) =>
  getCenteredScrollTop(
    { top, bottom },
    {
      scrollY: SCROLL_Y,
      viewportHeight: VIEWPORT_HEIGHT,
      topInset: TOP_INSET,
    }
  )

describe('getCenteredScrollTop', () => {
  it('centers an element that fits in the screen below the bar', () => {
    // 400px tall, in the 752px below the bar: 176px above and below it.
    const top = 300
    const scrollTop = getScrollTop(top, top + 400)
    expect(top - (scrollTop - SCROLL_Y)).toBe(TOP_INSET + 176)
  })

  it('lines the top of one too tall to fit up with the bottom of the bar', () => {
    const top = 300
    const scrollTop = getScrollTop(top, top + 900)
    expect(top - (scrollTop - SCROLL_Y)).toBe(TOP_INSET)
  })
})
