import { useRef } from 'react'
import { mockResizeObserver } from '@bvandrc/react-toolkit/test-support'
import { render, screen } from '@testing-library/react'

import { mockRects } from '@/test-helpers/layout'
import { type Span, useCenterSpan } from '../useCenterSpan'

const AREA_TEST_ID = 'area'
const BOX_TEST_ID = 'box'

// A parent 600px wide, centered at 300.
const AREA = new DOMRect(0, 0, 600, 100)
// A box 400px wide, from 100, so it can move up to 100px either way.
const BOX = new DOMRect(100, 0, 400, 100)

// A span from 100 to 300, centered at 200, 100px left of the parent's center.
const SPAN = { left: 100, right: 300 } satisfies Span

type CenteredProps = {
  measureSpan: (box: HTMLElement) => Span | undefined
  measureBounds?: (box: HTMLElement) => Span | undefined
}

const Centered = ({ measureSpan, measureBounds }: CenteredProps) => {
  const ref = useRef<HTMLDivElement>(null)
  useCenterSpan(ref, measureSpan, measureBounds)
  return (
    <div data-testid={AREA_TEST_ID}>
      <div ref={ref} data-testid={BOX_TEST_ID} />
    </div>
  )
}

const renderCentered = (measureSpan: CenteredProps['measureSpan']) =>
  render(<Centered measureSpan={measureSpan} />)

/** Lays out the parent and box, the box as given. */
const mockLayout = (box = BOX) =>
  mockRects({ [AREA_TEST_ID]: AREA, [BOX_TEST_ID]: box })

const getShift = () => screen.getByTestId(BOX_TEST_ID).style.translate

describe('useCenterSpan', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shifts the box so the span centers in the parent', () => {
    mockLayout()
    renderCentered(() => SPAN)
    expect(getShift()).toBe('100px')
  })

  it('shifts the box only as far as keeps it inside the parent', () => {
    // 80px from the parent's right edge, short of the 100px the span needs.
    mockLayout(new DOMRect(100, 0, 420, 100))
    renderCentered(() => SPAN)
    expect(getShift()).toBe('80px')
  })

  it('leaves a box as wide as the parent where it is', () => {
    mockLayout(AREA)
    renderCentered(() => SPAN)
    expect(getShift()).toBe('')
  })

  it('moves a box as wide as the parent as far as keeps its bounds inside', () => {
    mockLayout(AREA)
    // 120px from the parent's right edge, more than the 100px the span needs.
    render(
      <Centered
        measureSpan={() => SPAN}
        measureBounds={() => ({ left: 100, right: 480 })}
      />
    )
    expect(getShift()).toBe('100px')
  })

  it('leaves the box where it is when there is no span to center', () => {
    mockLayout()
    renderCentered(() => undefined)
    expect(getShift()).toBe('')
  })

  it('measures again on a resize', () => {
    const resize = mockResizeObserver()
    mockLayout()
    let span = SPAN
    renderCentered(() => span)

    // Now centered at 250, 50px left of the parent's center.
    span = { left: 200, right: 300 }
    resize()
    expect(getShift()).toBe('50px')
  })

  it('centers on the new span once given another way to measure one', () => {
    mockLayout()
    const { rerender } = renderCentered(() => SPAN)
    rerender(<Centered measureSpan={() => ({ left: 200, right: 300 })} />)
    expect(getShift()).toBe('50px')
  })
})
