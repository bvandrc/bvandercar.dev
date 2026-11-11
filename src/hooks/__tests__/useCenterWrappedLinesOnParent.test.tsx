import { useRef } from 'react'
import { mockResizeObserver } from '@bvandrc/react-toolkit/test-support'
import { render, screen } from '@testing-library/react'

import {
  buildItemRects,
  buildItemTestId,
  type ItemLayout,
  mockRects,
} from '@/test-helpers/layout'
import { useCenterWrappedLinesOnParent } from '../useCenterWrappedLinesOnParent'

const AREA_TEST_ID = 'area'
const LINES_TEST_ID = 'lines'

// A parent 600px wide, centered at 300.
const AREA = new DOMRect(0, 0, 600, 100)

// A first line from 100 to 300, then two items wrapped from 100 to 200,
// centered at 150, 150px left of the parent's center.
const WRAPPED: ItemLayout[] = [
  { line: 0, left: 100, right: 190 },
  { line: 0, left: 196, right: 300 },
  { line: 1, left: 100, right: 140 },
  { line: 1, left: 146, right: 200 },
]

const findFlexBoxes = (box: HTMLElement) =>
  box.querySelectorAll<HTMLElement>(`[data-testid="${LINES_TEST_ID}"]`)

type CenteredProps = { count: number; isEnabled?: boolean }

const Centered = ({ count, isEnabled }: CenteredProps) => {
  const ref = useRef<HTMLDivElement>(null)
  useCenterWrappedLinesOnParent(ref, findFlexBoxes, isEnabled)
  return (
    <div data-testid={AREA_TEST_ID}>
      <div ref={ref}>
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

const renderCentered = (count: number) => render(<Centered count={count} />)

/** Lays out the parent, and the items at `layouts`. */
const mockLayout = (layouts: ItemLayout[]) =>
  mockRects({ [AREA_TEST_ID]: AREA, ...buildItemRects(layouts) })

const getShift = (index: number) =>
  screen.getByTestId(buildItemTestId(index)).style.translate

describe('useCenterWrappedLinesOnParent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shifts every item on a wrapped line to center the line in the parent', () => {
    mockLayout(WRAPPED)
    renderCentered(4)
    for (const index of [2, 3]) {
      expect(getShift(index), buildItemTestId(index)).toBe('150px')
    }
  })

  it('leaves the first line where it is', () => {
    mockLayout(WRAPPED)
    renderCentered(4)
    for (const index of [0, 1]) {
      expect(getShift(index), buildItemTestId(index)).toBe('')
    }
  })

  it('drops its shifts, and sets none, once disabled', () => {
    mockLayout(WRAPPED)
    const { rerender } = renderCentered(4)
    rerender(<Centered count={4} isEnabled={false} />)
    expect(getShift(2)).toBe('')
  })

  it('measures again on a resize', () => {
    const resize = mockResizeObserver()
    mockLayout(WRAPPED)
    renderCentered(4)

    // The wrapped line now runs from 200 to 300, centered at 250.
    mockLayout([
      ...WRAPPED.slice(0, 2),
      { line: 1, left: 200, right: 240 },
      { line: 1, left: 246, right: 300 },
    ])
    resize()
    expect(getShift(2)).toBe('50px')
  })
})
