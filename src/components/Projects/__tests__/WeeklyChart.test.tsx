import { fireEvent, render, screen } from '@testing-library/react'

import { SELECTORS } from '~/test-support/selectors'
import {
  type ChartSeries,
  WeeklyChart,
  type WeeklyChartProps,
} from '../WeeklyChart'

const { PLOT, READOUT, RELEASE, RELEASE_LABEL } =
  SELECTORS.PROJECTS.WEEKLY_CHART

const WEEK_ENDS = ['2026-03-08', '2026-03-15', '2026-03-22']
const COMMITS = {
  noun: 'commit',
  weekly: [5, 1200, 12],
  tone: 'COMMITS',
} satisfies ChartSeries
const PRS = {
  noun: 'PR',
  weekly: [1, 0, 3],
  tone: 'PRS',
} satisfies ChartSeries

/** Renders the chart with `series`, summarized as "Running total". */
const renderChart = (
  series: ChartSeries[],
  props?: Pick<WeeklyChartProps, 'releases'>
) =>
  render(
    <WeeklyChart
      weekEnds={WEEK_ENDS}
      series={series}
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
    renderChart([COMMITS])

    expect(screen.getByTestId(READOUT).textContent).toBe('Running total')
  })

  it('names each of two or more series in the summary, as its legend', () => {
    renderChart([COMMITS, PRS])

    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Running totalcommitsPRs'
    )
  })

  it('reads out the running total through the week nearest the pointer, and the summary again once it leaves', () => {
    renderChart([COMMITS])
    const readout = screen.getByTestId(READOUT)

    // Past either end of the plot clamps to its first or last week.
    const CASES = [
      [-20, 'Through Mar 8, 2026: 5 commits'],
      // Closer to the middle week than to either end.
      [100, 'Through Mar 15, 2026: 1,205 commits'],
      [400, 'Through Mar 22, 2026: 1,217 commits'],
    ] as const
    for (const [clientX, expected] of CASES) {
      movePointer(clientX)
      expect(readout.textContent, String(clientX)).toBe(expected)
    }

    fireEvent.pointerLeave(screen.getByTestId(PLOT))
    expect(readout.textContent).toBe('Running total')
  })

  it("reads out every series' running total through the hovered week", () => {
    renderChart([COMMITS, PRS])

    movePointer(0)
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 8, 2026: 5 commits, 1 PR'
    )
  })

  it('marks each week with a release, and names its versions while hovered', () => {
    renderChart([COMMITS], {
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
    movePointer(128)
    expect(screen.queryByTestId(RELEASE_LABEL)).toBeNull()
  })

  it('reads out a tapped week, and keeps it once the finger lifts', () => {
    renderChart([COMMITS])
    const plot = screen.getByTestId(PLOT)

    fireEvent.pointerDown(plot, { clientX: 0, pointerType: 'touch' })
    fireEvent.pointerLeave(plot, { pointerType: 'touch' })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 8, 2026: 5 commits'
    )
  })
})
