import { fireEvent, render, screen } from '@testing-library/react'

import { SELECTORS } from '~/test-support/selectors'
import { WeeklyChart, type WeeklyChartProps } from '../WeeklyChart'

const { PLOT, READOUT, TOTAL, RELEASE, RELEASE_LABEL } =
  SELECTORS.PROJECTS.WEEKLY_CHART

/** Renders a chart of 5, 1,200, then 12 commits over three weeks ending Mar 22, summarized as "Running total". */
const renderChart = (props?: Pick<WeeklyChartProps, 'releases'>) =>
  render(
    <WeeklyChart
      weekEnds={['2026-03-08', '2026-03-15', '2026-03-22']}
      noun="commit"
      weekly={[5, 1200, 12]}
      tone="COMMITS"
      summary="Running total"
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

    expect(screen.getByTestId(READOUT).textContent).toBe('Running total')
  })

  it('writes the total beside the end of its line', () => {
    renderChart()

    expect(screen.getByTestId(TOTAL).textContent).toBe('1,217')
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
    expect(readout.textContent).toBe('Running total')
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

  it('marks each week with a release, and names its versions while hovered', () => {
    renderChart({
      releases: [
        { version: '1.0.0', day: '2026-03-02' },
        { version: '1.0.1', day: '2026-03-20' },
        { version: '1.1.0', day: '2026-03-22' },
      ],
    })

    // The second and third releases share the last week.
    expect(screen.getAllByTestId(RELEASE)).toHaveLength(2)
    expect(screen.queryByTestId(RELEASE_LABEL)).toBeNull()
    const CASES = [
      [0, 'v1.0.0'],
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
