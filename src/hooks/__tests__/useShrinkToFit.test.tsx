import { useRef } from 'react'
import { mockResizeObserver } from '@bvandrc/react-toolkit/test-support'
import { render, screen } from '@testing-library/react'

import { useShrinkToFit } from '../useShrinkToFit'

// One line's height, as the text's own.
const LINE_HEIGHT = 24

// What the test DOM, which lays nothing out, measures: the line's width, and
// whether it wraps at each size.
const layout = { width: 400, wrapsLarge: false, wrapsSmall: false }

/** A line around its text, whose size says whether the hook shrinks it. */
const ShrinkingLine = () => {
  const lineRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const isSmall = useShrinkToFit(lineRef, textRef)
  return (
    <div ref={lineRef} data-testid="line">
      <span ref={textRef} data-testid="text">
        {isSmall ? 'small' : 'large'}
      </span>
    </div>
  )
}

/** Measures the line's height by whether it wraps at the text's size, and its width as set. */
const mockLayout = () => {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
    () => layout.width
  )
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      if (this.dataset.testid !== 'line') {
        return LINE_HEIGHT
      }
      const isSmall = this.textContent === 'small'
      const isWrapped = isSmall ? layout.wrapsSmall : layout.wrapsLarge
      return isWrapped ? LINE_HEIGHT * 2 : LINE_HEIGHT
    }
  )
}

/** The size the hook gave the text. */
const getSize = () => screen.getByTestId('text').textContent

describe('useShrinkToFit', () => {
  beforeEach(() => {
    Object.assign(layout, { width: 400, wrapsLarge: false, wrapsSmall: false })
    mockLayout()
  })

  it('shrinks only where the smaller size saves a wrap the larger one makes', () => {
    const CASES = [
      // Fits as it is, so nothing to save.
      [{ wrapsLarge: false, wrapsSmall: false }, 'large'],
      // Fits once smaller.
      [{ wrapsLarge: true, wrapsSmall: false }, 'small'],
      // Wraps either way, so shrinking saves nothing.
      [{ wrapsLarge: true, wrapsSmall: true }, 'large'],
    ] as const
    for (const [wraps, expected] of CASES) {
      Object.assign(layout, wraps)
      const { unmount } = render(<ShrinkingLine />)
      expect(getSize(), JSON.stringify(wraps)).toBe(expected)
      unmount()
    }
  })

  it('measures again when the line widens, and not when only its height changes', () => {
    const resize = mockResizeObserver()
    Object.assign(layout, { wrapsLarge: true })
    render(<ShrinkingLine />)
    expect(getSize()).toBe('small')

    // Taller, as shrinking or growing its text would make it, at its width.
    Object.assign(layout, { wrapsLarge: false })
    resize()
    expect(getSize()).toBe('small')

    // Wide enough now for the larger size.
    layout.width = 800
    resize()
    expect(getSize()).toBe('large')
  })
})
