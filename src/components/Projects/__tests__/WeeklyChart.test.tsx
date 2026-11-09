import { createEvent, fireEvent, render, screen } from '@testing-library/react'

import { SELECTORS } from '~/test-support/selectors'
import { getWheelZoomFactor } from '../lib/weeks'
import { WeeklyChart, type WeeklyChartProps } from '../WeeklyChart'

const { PLOT, READOUT, TOTAL, DOT, RELEASE } = SELECTORS.PROJECTS.WEEKLY_CHART

/** Renders a chart of 5, 1,200, then 12 commits over the three weeks from Mar 2, summarized as "Commits". */
const renderChart = (
  props?: Pick<
    WeeklyChartProps,
    'releases' | 'span' | 'zoomed' | 'onZoom' | 'onPan'
  >
) =>
  render(
    <WeeklyChart
      firstDay="2026-03-02"
      weekEnds={['2026-03-08', '2026-03-15', '2026-03-22']}
      noun="commit"
      weekly={[5, 1200, 12]}
      tone="COMMITS"
      icon="git-commit"
      summary="Commits"
      data-testid="chart"
      {...props}
    />
  )

/** Turns the wheel over `target` at `clientX`, with any other `init`, returning whether the page would scroll. */
const turnWheel = (
  target: Element,
  clientX: number,
  deltaY: number,
  init?: WheelEventInit
) => {
  const event = createEvent.wheel(target, { deltaY })
  // The test DOM's WheelEvent drops a clientX or ctrlKey passed in, which a
  // browser's keeps.
  for (const [key, value] of Object.entries({ clientX, ...init })) {
    Object.defineProperty(event, key, { value })
  }
  return fireEvent(target, event)
}

/** Moves the pointer to `clientX` on the plot, which the test DOM lays out from x = 0. */
const movePointer = (clientX: number) =>
  fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX })

describe('WeeklyChart', () => {
  it('reads out the running total through the week nearest the pointer, and the summary again once it leaves', () => {
    renderChart()
    const readout = screen.getByTestId(READOUT)

    // Past either end of the plot clamps to its first or last week.
    const CASES = [
      [-20, 'Through Mar 8, 2026: 5 commits'],
      // Closer to the middle week than to either end.
      [140, 'Through Mar 15, 2026: 1,205 commits'],
      [400, 'Through Mar 22, 2026: 1,217 commits'],
    ] as const
    for (const [clientX, expected] of CASES) {
      movePointer(clientX)
      expect(readout.textContent, String(clientX)).toBe(expected)
    }

    fireEvent.pointerLeave(screen.getByTestId(PLOT))
    expect(readout.textContent).toBe('Commits')
  })

  it('leaves out the weeks before a later span start, starting from the total by then', () => {
    renderChart({ span: { start: '2026-03-10', end: '2026-03-22' } })

    // Its left edge is now in the second week, where the total had reached 1,205.
    movePointer(0)
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 15, 2026: 1,205 commits'
    )
    expect(screen.getByTestId(TOTAL).textContent).toBe('1.2K')
  })

  it('keeps its height from zero to the total while zoomed in, so a count sits at the same height', () => {
    /** The hover dot's height on the middle week, Mar 9 to 15. */
    const getMiddleDotY = () => {
      movePointer(140)
      return screen.getByTestId(DOT).getAttribute('cy')
    }
    const { unmount } = renderChart()
    const unzoomed = getMiddleDotY()
    unmount()

    renderChart({
      span: { start: '2026-03-09', end: '2026-03-16' },
      zoomed: true,
    })
    movePointer(0)
    // Across a zoomed span, the pointer finds the middle week further left.
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 15, 2026: 1,205 commits'
    )
    expect(screen.getByTestId(DOT).getAttribute('cy')).toBe(unzoomed)
  })

  it('reads out a tapped week, and keeps it once the finger lifts', () => {
    renderChart()
    const plot = screen.getByTestId(PLOT)

    fireEvent.pointerDown(plot, { clientX: 0, pointerType: 'touch' })
    fireEvent.pointerLeave(plot, { pointerType: 'touch' })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 8, 2026: 5 commits'
    )
  })

  it('marks each day with a release with a line, one for releases on the same day', () => {
    renderChart({
      releases: [
        { version: '1.0.0', day: '2026-03-02' },
        { version: '1.0.1', day: '2026-03-20' },
        // The same day as the last, so drawn on the same line.
        { version: '1.0.2', day: '2026-03-20' },
        { version: '1.1.0', day: '2026-03-22' },
      ],
    })

    expect(screen.getAllByTestId(RELEASE)).toHaveLength(3)
  })

  it('zooms with the wheel, around the time under the pointer, in place of scrolling the page', () => {
    const onZoom = vi.fn()
    renderChart({ onZoom })

    // Over the plot's start, so the time is the first day's.
    const scrolled = turnWheel(screen.getByTestId(PLOT), 5, -100)
    expect(onZoom).toHaveBeenCalledWith(
      Date.parse('2026-03-02'),
      getWheelZoomFactor(-100)
    )
    expect(scrolled).toBe(false)
  })

  it("zooms for a trackpad's pinch, around the point under it, rather than as a wheel's turn", () => {
    const onZoom = vi.fn()
    renderChart({ onZoom })
    const plot = screen.getByTestId(PLOT)

    // A trackpad pinch reaches the page as a wheel with ctrl held: two
    // steps apart, since the first only sets where the pinch starts.
    for (const deltaY of [-10, -10]) {
      turnWheel(plot, 150, deltaY, { ctrlKey: true })
    }
    // A plain wheel turned at the same point, for the time there.
    turnWheel(plot, 150, -100)
    const [pinchCall, wheelCall] = onZoom.mock.calls
    expect(onZoom).toHaveBeenCalledTimes(2)
    // Spreading, so zooming in, by its own scale rather than a wheel's.
    expect(pinchCall[1]).toBeLessThan(1)
    expect(pinchCall[1]).not.toBe(wheelCall[1])
    expect(pinchCall[0]).toBe(wheelCall[0])
  })

  it('reads out a week, not a zoom, for one finger moving alone', () => {
    const onZoom = vi.fn()
    renderChart({ onZoom })
    const plot = screen.getByTestId(PLOT)

    fireEvent.pointerDown(plot, {
      pointerId: 1,
      clientX: 0,
      pointerType: 'touch',
    })
    fireEvent.pointerMove(plot, {
      pointerId: 1,
      clientX: 400,
      pointerType: 'touch',
    })
    expect(onZoom).not.toHaveBeenCalled()
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 22, 2026: 1,217 commits'
    )
  })

  it('pans for a sideways scroll, later for one to the right, rather than zooming', () => {
    const onZoom = vi.fn()
    const onPan = vi.fn()
    renderChart({ onZoom, onPan })

    turnWheel(screen.getByTestId(PLOT), 150, 0, { deltaX: 40 })
    expect(onZoom).not.toHaveBeenCalled()
    expect(onPan).toHaveBeenCalledWith(expect.any(Number))
    expect(onPan.mock.calls[0][0]).toBeGreaterThan(0)
  })

  it("hides the total while zoomed in short of the line's end", () => {
    renderChart({ span: { start: '2026-03-02', end: '2026-03-15' } })

    expect(screen.queryByTestId(TOTAL)).toBeNull()
  })

  it('snaps to a release line under the pointer, reading out its latest version and day', () => {
    renderChart({
      releases: [
        { version: '1.0.1', day: '2026-03-12' },
        { version: '1.0.2', day: '2026-03-12' },
      ],
    })
    const release = screen.getByTestId(RELEASE)
    const releaseX = Number(release.getAttribute('x1'))
    const readout = screen.getByTestId(READOUT)

    // A pixel off the line still lands on it.
    movePointer(releaseX + 1)
    // Two that day, named by the latest.
    expect(readout.textContent).toBe('v1.0.2 released Mar 12, 2026')
    // Further off, the week reads out as before.
    movePointer(releaseX + 20)
    expect(readout.textContent).toMatch(/^Through /)
  })
})
