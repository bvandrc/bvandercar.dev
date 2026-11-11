import { useRef } from 'react'
import { mockResizeObserver } from '@bvandrc/react-toolkit/test-support'
import { act, render, screen } from '@testing-library/react'

import {
  buildItemRects,
  buildItemTestId,
  type ItemLayout,
  mockRects,
} from '@/test-helpers/layout'
import { useCenterOnFirstLine } from '../useCenterOnFirstLine'

const AREA_TEST_ID = 'area'
const BOX_TEST_ID = 'box'
const LINES_TEST_ID = 'lines'

// A parent 600px wide, centered at 300.
const AREA = new DOMRect(0, 0, 600, 100)
// A box 400px wide, from 100, so it can move up to 100px either way.
const BOX = new DOMRect(100, 0, 400, 100)

// A first line from 100 to 300, centered at 200, 100px left of the parent's center.
const FIRST_LINE: ItemLayout[] = [
  { line: 0, left: 100, right: 200 },
  { line: 0, left: 206, right: 300 },
]

const findLines = (box: HTMLElement) =>
  box.querySelector<HTMLElement>(`[data-testid="${LINES_TEST_ID}"]`)

type ShiftedProps = { count: number; isEnabled?: boolean }

const Shifted = ({ count, isEnabled }: ShiftedProps) => {
  const ref = useRef<HTMLDivElement>(null)
  useCenterOnFirstLine(ref, findLines, isEnabled)
  return (
    <div data-testid={AREA_TEST_ID}>
      <div ref={ref} data-testid={BOX_TEST_ID}>
        <div data-testid={LINES_TEST_ID}>
          {Array.from({ length: count }, (_, index) => (
            <span
              key={buildItemTestId(index)}
              data-testid={buildItemTestId(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const renderShifted = (count: number) => render(<Shifted count={count} />)

/** Lays out the parent and box as given, and the items at `layouts`. */
const mockLayout = (layouts: ItemLayout[], box = BOX) =>
  mockRects({
    [AREA_TEST_ID]: AREA,
    [BOX_TEST_ID]: box,
    ...buildItemRects(layouts),
  })

const getShift = () => screen.getByTestId(BOX_TEST_ID).style.translate

describe('useCenterOnFirstLine', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shifts the box so its first line centers in the parent', () => {
    mockLayout(FIRST_LINE)
    renderShifted(2)
    expect(getShift()).toBe('100px')
  })

  it('centers the first line alone, not the lines that wrap below it', () => {
    mockLayout([...FIRST_LINE, { line: 1, left: 100, right: 400 }])
    renderShifted(3)
    expect(getShift()).toBe('100px')
  })

  it('shifts the box only as far as keeps it inside the parent', () => {
    // 80px from the parent's right edge, short of the 100px the line needs.
    mockLayout(FIRST_LINE, new DOMRect(100, 0, 420, 100))
    renderShifted(2)
    expect(getShift()).toBe('80px')
  })

  it('leaves a box as wide as the parent where it is', () => {
    mockLayout(FIRST_LINE, AREA)
    renderShifted(2)
    expect(getShift()).toBe('')
  })

  it('moves the box back, and leaves it there, once disabled', () => {
    mockLayout(FIRST_LINE)
    const { rerender } = renderShifted(2)
    rerender(<Shifted count={2} isEnabled={false} />)
    expect(getShift()).toBe('')
  })

  it('measures again on a resize', () => {
    const resize = mockResizeObserver()
    mockLayout(FIRST_LINE)
    renderShifted(2)

    // Now centered at 250, 50px left of the parent's center.
    mockLayout([
      { line: 0, left: 100, right: 200 },
      { line: 0, left: 300, right: 400 },
    ])
    act(resize)
    expect(getShift()).toBe('50px')
  })
})
