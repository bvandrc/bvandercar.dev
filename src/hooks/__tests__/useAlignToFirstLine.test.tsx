import { useRef } from 'react'
import { mockResizeObserver } from '@bvandrc/react-toolkit/test-support'
import { render, screen } from '@testing-library/react'

import {
  buildItemRects,
  buildItemTestId,
  type ItemLayout,
  mockRects,
} from '@/test-helpers/layout'
import { useAlignToFirstLine } from '../useAlignToFirstLine'

const BOX_TEST_ID = 'box'
const LINES_TEST_ID = 'lines'

// A flex box from 100 to 400.
const LINES = new DOMRect(100, 0, 300, 100)

// A first line from 140, 40px in from the flex box's start, then one wrapped.
const CENTERED: ItemLayout[] = [
  { line: 0, left: 140, right: 240 },
  { line: 0, left: 246, right: 360 },
  { line: 1, left: 100, right: 400 },
]

const Aligned = ({ count }: { count: number }) => {
  const ref = useRef<HTMLDivElement>(null)
  const linesRef = useRef<HTMLDivElement>(null)
  useAlignToFirstLine(ref, linesRef)
  return (
    <div>
      <div ref={ref} data-testid={BOX_TEST_ID} />
      <div ref={linesRef} data-testid={LINES_TEST_ID}>
        {Array.from({ length: count }, (_, index) => (
          <span
            key={buildItemTestId(index)}
            data-testid={buildItemTestId(index)}
          />
        ))}
      </div>
    </div>
  )
}

const renderAligned = (count: number) => render(<Aligned count={count} />)

/** Lays out the flex box, and its items at `layouts`. */
const mockLayout = (layouts: ItemLayout[]) =>
  mockRects({ [LINES_TEST_ID]: LINES, ...buildItemRects(layouts) })

const getShift = () => screen.getByTestId(BOX_TEST_ID).style.translate

describe('useAlignToFirstLine', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shifts the box as far as the first line starts in from the flex box', () => {
    mockLayout(CENTERED)
    renderAligned(3)
    expect(getShift()).toBe('40px')
  })

  it('rounds the shift down, so the box never runs into the line', () => {
    mockLayout([{ line: 0, left: 140.6, right: 240 }])
    renderAligned(1)
    expect(getShift()).toBe('40px')
  })

  it('leaves the box where it is when the first line starts at the flex box', () => {
    mockLayout([{ line: 0, left: 100, right: 200 }])
    renderAligned(1)
    expect(getShift()).toBe('')
  })

  it('measures again on a resize', () => {
    const resize = mockResizeObserver()
    mockLayout(CENTERED)
    renderAligned(3)

    mockLayout([
      { line: 0, left: 120, right: 240 },
      { line: 0, left: 246, right: 380 },
      { line: 1, left: 100, right: 400 },
    ])
    resize()
    expect(getShift()).toBe('20px')
  })
})
