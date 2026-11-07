import { fireEvent, render, screen } from '@testing-library/react'

import { SELECTORS } from '~/test-support/selectors'
import { type ChartSeries, WeeklyChart } from '../WeeklyChart'

const { PLOT, READOUT } = SELECTORS.PROJECTS.WEEKLY_CHART

const WEEK_STARTS = ['2026-03-02', '2026-03-09', '2026-03-16']
const COMMITS = {
  noun: 'commit',
  weekly: [5, 1200, 12],
  tone: 'FIRST',
} satisfies ChartSeries
const PRS = {
  noun: 'PR',
  weekly: [1, 0, 3],
  tone: 'SECOND',
} satisfies ChartSeries

/** Renders the chart with `series`, summarized as "Weekly". */
const renderChart = (series: ChartSeries[]) =>
  render(
    <WeeklyChart
      weekStarts={WEEK_STARTS}
      series={series}
      summary="Weekly"
      data-testid="chart"
    />
  )

/** Moves the pointer to `clientX` on the plot, which the test DOM lays out from x = 0. */
const movePointer = (clientX: number) =>
  fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX })

describe('WeeklyChart', () => {
  it('reads out its summary until hovered', () => {
    renderChart([COMMITS])

    expect(screen.getByTestId(READOUT).textContent).toBe('Weekly')
  })

  it('names each of two or more series in the summary, as its legend', () => {
    renderChart([COMMITS, PRS])

    expect(screen.getByTestId(READOUT).textContent).toBe('WeeklycommitsPRs')
  })

  it('reads out the week nearest the pointer, and the summary again once it leaves', () => {
    renderChart([COMMITS])
    const readout = screen.getByTestId(READOUT)

    // Past either end of the plot clamps to its first or last week.
    const CASES = [
      [-20, 'Week of Mar 2, 2026: 5 commits'],
      // Closer to the middle week than to either end.
      [100, 'Week of Mar 9, 2026: 1,200 commits'],
      [400, 'Week of Mar 16, 2026: 12 commits'],
    ] as const
    for (const [clientX, expected] of CASES) {
      movePointer(clientX)
      expect(readout.textContent, String(clientX)).toBe(expected)
    }

    fireEvent.pointerLeave(screen.getByTestId(PLOT))
    expect(readout.textContent).toBe('Weekly')
  })

  it("reads out every series' count for the hovered week", () => {
    renderChart([COMMITS, PRS])

    movePointer(0)
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Week of Mar 2, 2026: 5 commits, 1 PR'
    )
  })
})
