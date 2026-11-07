import { fireEvent, render, screen } from '@testing-library/react'

import { SELECTORS } from '~/test-support/selectors'
import { WeeklyChart, type WeeklyChartProps } from '../WeeklyChart'

const { PLOT, READOUT, TOTAL, RELEASE, RELEASE_LABEL } =
  SELECTORS.PROJECTS.WEEKLY_CHART

/** Renders a chart of 5, 1,200, then 12 commits over the three weeks from Mar 2, summarized as "Commits". */
const renderChart = (props?: Pick<WeeklyChartProps, 'releases' | 'span'>) =>
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

/** Moves the pointer to `clientX` on the plot, which the test DOM lays out from x = 0. */
const movePointer = (clientX: number) =>
  fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX })

describe('WeeklyChart', () => {
  it('reads out its summary until hovered', () => {
    renderChart()

    expect(screen.getByTestId(READOUT).textContent).toBe('Commits')
  })

  it('leads its caption with its glyph, hovered or not', () => {
    renderChart()
    const readout = screen.getByTestId(READOUT)

    expect(readout.firstElementChild?.tagName).toBe('svg')
    movePointer(0)
    expect(readout.firstElementChild?.tagName).toBe('svg')
  })

  it('writes the total, shortened, beside the end of its line', () => {
    renderChart()

    expect(screen.getByTestId(TOTAL).textContent).toBe('1.2K')
  })

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

  it('reads out a tapped week, and keeps it once the finger lifts', () => {
    renderChart()
    const plot = screen.getByTestId(PLOT)

    fireEvent.pointerDown(plot, { clientX: 0, pointerType: 'touch' })
    fireEvent.pointerLeave(plot, { pointerType: 'touch' })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 8, 2026: 5 commits'
    )
  })

  it("marks each day with a release, and names its week's versions while hovered", () => {
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
    expect(screen.queryByTestId(RELEASE_LABEL)).toBeNull()
    const CASES = [
      [0, 'v1.0.0'],
      // The last three share the last week.
      [400, 'v1.0.1–v1.1.0'],
    ] as const
    for (const [clientX, expected] of CASES) {
      movePointer(clientX)
      expect(
        screen.getByTestId(RELEASE_LABEL).textContent,
        String(clientX)
      ).toBe(expected)
    }
    // The middle week had no release.
    movePointer(140)
    expect(screen.queryByTestId(RELEASE_LABEL)).toBeNull()
  })
})
