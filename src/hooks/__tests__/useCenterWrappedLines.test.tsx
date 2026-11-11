import { useRef } from 'react'
import { mockResizeObserver } from '@bvandrc/react-toolkit/test-support'
import { act, render, screen } from '@testing-library/react'

import { useCenterWrappedLines } from '../useCenterWrappedLines'

const LINE_HEIGHT = 20
const LINE_GAP = 6

/** Where an item sits: its line, counting from 0, and its left and right edges. */
type ItemLayout = { line: number; left: number; right: number }

const buildRect = ({ line, left, right }: ItemLayout) =>
  new DOMRect(left, line * (LINE_HEIGHT + LINE_GAP), right - left, LINE_HEIGHT)

const buildItemTestId = (index: number) => `item-${index}`

/** Lays out the items, by test id, as `layouts` places them, until called again. */
const mockLayout = (layouts: ItemLayout[]) => {
  const rects = new Map(
    layouts.map((layout, index) => [buildItemTestId(index), buildRect(layout)])
  )
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      return rects.get(this.dataset.testid ?? '') ?? new DOMRect()
    }
  )
}

const Lines = ({ count }: { count: number }) => {
  const ref = useRef<HTMLDivElement>(null)
  useCenterWrappedLines(ref)
  return (
    <div ref={ref}>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={buildItemTestId(index)}
          data-testid={buildItemTestId(index)}
        />
      ))}
    </div>
  )
}

const renderLines = (count: number) => render(<Lines count={count} />)

const getOffset = (index: number) =>
  screen.getByTestId(buildItemTestId(index)).style.marginInlineStart

// Two items on a line 120px wide, then one 40px wide wrapped below them.
const NARROWER_WRAP: ItemLayout[] = [
  { line: 0, left: 0, right: 50 },
  { line: 0, left: 56, right: 120 },
  { line: 1, left: 0, right: 40 },
]

describe('useCenterWrappedLines', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('centers a wrapped line narrower than the first under it', () => {
    mockLayout(NARROWER_WRAP)
    renderLines(3)
    expect(getOffset(2)).toBe('40px')
  })

  it('leaves the first line, and the rest of a wrapped one, where they are', () => {
    mockLayout(NARROWER_WRAP)
    renderLines(3)
    for (const index of [0, 1]) {
      expect(getOffset(index), buildItemTestId(index)).toBe('')
    }
  })

  it('starts a wrapped line wider than the first where the first starts', () => {
    mockLayout([
      { line: 0, left: 0, right: 60 },
      { line: 1, left: 0, right: 50 },
      { line: 1, left: 56, right: 120 },
    ])
    renderLines(3)
    expect(getOffset(1)).toBe('')
  })

  it('measures again on a resize, dropping an offset the line no longer needs', () => {
    const resize = mockResizeObserver()
    mockLayout(NARROWER_WRAP)
    renderLines(3)

    mockLayout([
      { line: 0, left: 0, right: 50 },
      { line: 0, left: 56, right: 120 },
      { line: 0, left: 126, right: 166 },
    ])
    act(resize)
    expect(getOffset(2)).toBe('')
  })
})
