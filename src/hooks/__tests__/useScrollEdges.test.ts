import { mockResizeObserver } from '@bvandrc/react-toolkit/test-support'
import { act, renderHook } from '@testing-library/react'

import { useScrollEdges } from '../useScrollEdges'

const CLIENT_WIDTH = 300

/** A scroller `CLIENT_WIDTH` px wide, with content `scrollWidth` px wide, scrolled to `scrollLeft`. */
const createScroller = (scrollWidth: number, scrollLeft = 0) => {
  const scroller = document.createElement('div')
  scroller.append(document.createElement('ul'))
  const layout = { scrollWidth, scrollLeft }
  Object.defineProperties(scroller, {
    clientWidth: { get: () => CLIENT_WIDTH },
    scrollWidth: { get: () => layout.scrollWidth },
    scrollLeft: { get: () => layout.scrollLeft },
  })
  return { scroller, layout }
}

const renderScrollEdges = (scroller: HTMLElement) => {
  const ref = { current: scroller }
  return renderHook(() => useScrollEdges(ref))
}

describe('useScrollEdges', () => {
  let reportResize: () => void
  beforeEach(() => {
    reportResize = mockResizeObserver()
  })

  it('is at both edges where the content fits', () => {
    const { scroller } = createScroller(CLIENT_WIDTH)
    const { result } = renderScrollEdges(scroller)
    expect(result.current).toEqual({ atStart: true, atEnd: true })
  })

  it('is at each edge only once scrolled to it', () => {
    const { scroller, layout } = createScroller(500)
    const { result } = renderScrollEdges(scroller)
    expect(result.current, 'at the start').toEqual({
      atStart: true,
      atEnd: false,
    })

    const CASES = [
      [100, { atStart: false, atEnd: false }],
      [200, { atStart: false, atEnd: true }],
      // Short of the end by under a px, as on a zoomed page.
      [199.5, { atStart: false, atEnd: true }],
      [0.5, { atStart: true, atEnd: false }],
    ] as const
    for (const [scrollLeft, edges] of CASES) {
      layout.scrollLeft = scrollLeft
      act(() => {
        scroller.dispatchEvent(new Event('scroll'))
      })
      expect(result.current, String(scrollLeft)).toEqual(edges)
    }
  })

  it('keeps up as its content resizes', () => {
    const { scroller, layout } = createScroller(500)
    const { result } = renderScrollEdges(scroller)

    layout.scrollWidth = CLIENT_WIDTH
    reportResize()
    expect(result.current).toEqual({ atStart: true, atEnd: true })
  })
})
