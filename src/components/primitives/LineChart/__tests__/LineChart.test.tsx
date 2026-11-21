import { fireEvent, render, screen } from '@testing-library/react'

import { turnWheel } from '@/test-helpers/wheel'
import { SELECTORS } from '~/test-support/selectors'
import {
  LineChart,
  type LineChartHover,
  type LineChartProps,
} from '../LineChart'
import { PLOT } from '../lib/plot'

const {
  PLOT: PLOT_ID,
  CAPTION,
  DOT,
  MARKER,
  END_LABEL,
  END_NOTE,
} = SELECTORS.LINE_CHART

// A line from 20 to 100 along x, rising from 0 to 10.
const POINTS = [
  { x: 20, y: 0 },
  { x: 60, y: 4 },
  { x: 100, y: 10 },
] satisfies LineChartProps['points']
const DOMAIN = { start: 0, end: 100 } satisfies LineChartProps['domain']

/** Where `x` falls across the plot over `DOMAIN`, which the test DOM lays out from 0. */
const getPlotX = (x: number) =>
  PLOT.INSET + (x / DOMAIN.end) * (PLOT.RIGHT - PLOT.INSET)

/** Captions the pointer's place along x, rounded, its marker, or "none" off the plot. */
const captionHover = (hover: LineChartHover | undefined) => {
  if (!hover) {
    return 'none'
  }
  return hover.marker === undefined
    ? `x ${Math.round(hover.x)}`
    : `marker ${hover.marker}`
}

/** Builds a chart of `POINTS` over `DOMAIN`, captioned by `captionHover`. */
const buildChart = (props?: Partial<LineChartProps>) => (
  <LineChart
    points={POINTS}
    domain={DOMAIN}
    range={{ low: 0, high: 10 }}
    colorClassName="text-commits"
    renderCaption={captionHover}
    endLabel="10"
    endNote="+10"
    {...props}
  />
)

/** Renders `buildChart`'s chart. */
const renderChart = (props?: Partial<LineChartProps>) =>
  render(buildChart(props))

/** Moves the pointer to `clientX` on the plot. */
const movePointer = (clientX: number) =>
  fireEvent.pointerMove(screen.getByTestId(PLOT_ID), { clientX })

describe('LineChart', () => {
  it('captions where the pointer is along x, and nothing once it leaves', () => {
    renderChart()

    movePointer(getPlotX(60))
    expect(screen.getByTestId(CAPTION).textContent).toBe('x 60')

    fireEvent.pointerLeave(screen.getByTestId(PLOT_ID))
    expect(screen.getByTestId(CAPTION).textContent).toBe('none')
  })

  it("keeps the pointer's place between the line's start and the domain's end", () => {
    renderChart()
    const caption = screen.getByTestId(CAPTION)

    const CASES = [
      // Left of the line's start, which is past the domain's.
      [getPlotX(5), 'x 20'],
      // Past the plot's right edge, over the end label.
      [PLOT.WIDTH + 20, 'x 100'],
    ] as const
    for (const [clientX, expected] of CASES) {
      movePointer(clientX)
      expect(caption.textContent, String(clientX)).toBe(expected)
    }
  })

  it('captions what is under a still pointer once the domain moves beneath it', () => {
    const { rerender } = renderChart()
    movePointer(getPlotX(40))
    expect(screen.getByTestId(CAPTION).textContent).toBe('x 40')

    // The same place across the plot, 40% of the way along the new domain.
    rerender(buildChart({ domain: { start: 50, end: 150 } }))
    expect(screen.getByTestId(CAPTION).textContent).toBe('x 90')
  })

  it('keeps a tapped place once the finger lifts', () => {
    renderChart()
    const plot = screen.getByTestId(PLOT_ID)

    fireEvent.pointerDown(plot, { clientX: getPlotX(60), pointerType: 'touch' })
    fireEvent.pointerLeave(plot, { pointerType: 'touch' })
    expect(screen.getByTestId(CAPTION).textContent).toBe('x 60')
  })

  it('marks the hover point with a dot, but not while the pointer is snapped to a marker a few pixels off', () => {
    renderChart({ markers: [40], getHoverPoint: () => POINTS[1] })
    const markerX = Number(screen.getByTestId(MARKER).getAttribute('x1'))

    movePointer(markerX + 3)
    expect(screen.getByTestId(CAPTION).textContent).toBe('marker 40')
    expect(screen.queryByTestId(DOT)).toBeNull()

    movePointer(markerX + 20)
    expect(screen.getByTestId(CAPTION).textContent).toMatch(/^x /)
    expect(screen.getByTestId(DOT)).toBeDefined()
  })

  it('leaves out markers outside the domain', () => {
    renderChart({ markers: [-10, 0, 50, 100, 150] })

    expect(screen.getAllByTestId(MARKER)).toHaveLength(3)
  })

  // How a wheel, a pinch, or a drag zooms and pans is useZoomPanGestures'
  // own, tested in @bvandrc/react-toolkit; this keeps what the chart adds.
  it('zooms with the wheel around the x under the pointer, kept to where the line starts', () => {
    const onZoom = vi.fn()
    renderChart({ onZoom })

    turnWheel(screen.getByTestId(PLOT_ID), getPlotX(5), -100)
    expect(onZoom).toHaveBeenCalledWith(20, expect.any(Number))
  })

  it('pans by the x a mouse drag covers, the other way, so the line follows the mouse', () => {
    const onPan = vi.fn()
    renderChart({ onZoom: vi.fn(), onPan })
    const plot = screen.getByTestId(PLOT_ID)
    const init = { pointerId: 1, pointerType: 'mouse', buttons: 1 }

    fireEvent.pointerDown(plot, { ...init, clientX: getPlotX(50) })
    fireEvent.pointerMove(plot, { ...init, clientX: getPlotX(60) })
    fireEvent.pointerUp(plot, { ...init, clientX: getPlotX(60) })
    // Dragged 10 along x to the right, so it shows what's 10 earlier.
    const panned = onPan.mock.calls.reduce((sum, [delta]) => sum + delta, 0)
    expect(panned).toBeCloseTo(-10)
  })

  it("writes the end label and note only while the line's end is in view", () => {
    const { rerender } = renderChart()
    expect(screen.getByTestId(END_LABEL).textContent).toBe('10')
    expect(screen.getByTestId(END_NOTE).textContent).toBe('+10')

    // Zoomed in short of the line's end.
    rerender(buildChart({ domain: { start: 0, end: 50 } }))
    expect(screen.queryByTestId(END_LABEL)).toBeNull()
    expect(screen.queryByTestId(END_NOTE)).toBeNull()
  })

  it('shows a grab cursor only while pannable, with a pan to make', () => {
    const CASES = [
      [{ pannable: true, onPan: vi.fn() }, true],
      // Nothing to call with the drag.
      [{ pannable: true }, false],
      [{ onPan: vi.fn() }, false],
    ] as const
    for (const [props, grabs] of CASES) {
      const { unmount } = renderChart(props)
      expect(
        screen.getByTestId(PLOT_ID).classList.contains('cursor-grab'),
        JSON.stringify(Object.keys(props))
      ).toBe(grabs)
      unmount()
    }
  })
})
