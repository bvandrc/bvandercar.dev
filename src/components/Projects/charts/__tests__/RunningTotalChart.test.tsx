import { fireEvent, render, screen } from '@testing-library/react'

import { SELECTORS } from '~/test-support/selectors'
import {
  RunningTotalChart,
  type RunningTotalChartViewProps,
} from '../RunningTotalChart'

const { PLOT, CAPTION, END_LABEL, END_NOTE, MARKER } = SELECTORS.LINE_CHART

// Each day's commits for the three weeks from Mar 2: 5, 1,200, then 12.
const DAILY = [
  1, 0, 1, 0, 1, 1, 1, 200, 100, 300, 100, 200, 200, 100, 2, 2, 2, 2, 2, 1, 1,
]

/** Builds a chart of `DAILY`, reading out each week, summarized as "Commits". */
const buildChart = (props?: RunningTotalChartViewProps) => (
  <RunningTotalChart
    firstDay="2026-03-02"
    daily={DAILY}
    periodEnds={['2026-03-08', '2026-03-15', '2026-03-22']}
    noun="commit"
    tone="COMMITS"
    icon="git-commit"
    summary="Commits"
    data-testid="chart"
    {...props}
  />
)

/** Renders `buildChart`'s chart. */
const renderChart = (props?: RunningTotalChartViewProps) =>
  render(buildChart(props))

/** Moves the pointer to `clientX` on the plot, which the test DOM lays out from x = 0. */
const movePointer = (clientX: number) =>
  fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX })

describe('RunningTotalChart', () => {
  it('reads out the running total through the week nearest the pointer, and the summary again once it leaves', () => {
    renderChart()
    const readout = screen.getByTestId(CAPTION)

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

  it('leaves out the days before a later span start, starting from the total by then', () => {
    renderChart({ span: { start: '2026-03-10', end: '2026-03-22' } })

    // Its left edge is now in the second week, where the total had reached 1,205.
    movePointer(0)
    expect(screen.getByTestId(CAPTION).textContent).toBe(
      'Through Mar 15, 2026: 1,205 commits'
    )
    expect(screen.getByTestId(END_LABEL).textContent).toBe('1.2K')
  })

  it('writes what the stretch in view added under the total, while zoomed in on one that starts past zero', () => {
    const { unmount } = renderChart()
    // From zero, the total says it all.
    expect(screen.queryByTestId(END_NOTE)).toBeNull()
    unmount()
    // Its full view, starting partway, like the footer's charts' all time.
    const { unmount: unmountPartway } = renderChart({
      span: { start: '2026-03-09', end: '2026-03-22' },
    })
    expect(screen.queryByTestId(END_NOTE)).toBeNull()
    unmountPartway()

    renderChart({
      span: { start: '2026-03-09', end: '2026-03-22' },
      zoomed: true,
    })
    // 1,217 in all, 5 of them by Mar 9.
    expect(screen.getByTestId(END_LABEL).textContent).toBe('1.2K')
    expect(screen.getByTestId(END_NOTE).textContent).toBe('+1.2K')
  })

  it('snaps to a release line under the pointer, reading out its latest version and day', () => {
    renderChart({
      releases: [
        { version: '1.0.1', day: '2026-03-12' },
        { version: '1.0.2', day: '2026-03-12' },
      ],
    })
    const release = screen.getByTestId(MARKER)
    const releaseX = Number(release.getAttribute('x1'))
    const readout = screen.getByTestId(CAPTION)

    // A pixel off the line still lands on it.
    movePointer(releaseX + 1)
    // Two that day, named by the latest.
    expect(readout.textContent).toBe('v1.0.2 released Mar 12, 2026')
    // Further off, the week reads out as before.
    movePointer(releaseX + 20)
    expect(readout.textContent).toMatch(/^Through /)
  })
})
