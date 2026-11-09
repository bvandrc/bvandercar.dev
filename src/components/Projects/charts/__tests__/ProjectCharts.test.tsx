import { render, screen, within } from '@testing-library/react'

import { turnWheel } from '@/test-helpers/wheel'
import type { CommitHistory, DownloadHistory, Release } from '~/counts'
import { SELECTORS } from '~/test-support/selectors'
import type { DaySpan } from '../lib/spans'
import { ProjectCharts, type ProjectChartsProps } from '../ProjectCharts'

const { ACTIVITY_CHART, DOWNLOADS_CHART, RUNNING_TOTAL_CHART } =
  SELECTORS.PROJECTS
const { PLOT, RELEASE } = RUNNING_TOTAL_CHART

// 3, 40, then 12 commits a week from Monday, Feb 23, then quiet to Mar 26.
const ACTIVITY = {
  firstDay: '2026-02-23',
  lastDay: '2026-03-26',
  commits: [
    1, 0, 0, 1, 0, 1, 0, 5, 10, 0, 5, 10, 5, 5, 3, 4, 0, 5, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ],
} satisfies CommitHistory

// 5, 1,200, then 12 downloads a week from Mar 4 to 24.
const DOWNLOADS = {
  registry: 'npm',
  history: {
    firstDay: '2026-03-04',
    lastDay: '2026-03-24',
    daily: [
      1, 1, 1, 1, 1, 0, 0, 200, 300, 100, 200, 100, 200, 100, 2, 2, 2, 2, 2, 1,
      1,
    ],
  } satisfies DownloadHistory,
} satisfies ProjectChartsProps['downloads']

const RELEASES = [
  { version: '1.0.0', day: '2026-03-04' },
  { version: '1.1.0', day: '2026-03-12' },
] satisfies Release[]

// From the first release to the later of the two histories' last days.
const SPAN = { start: '2026-03-04', end: '2026-03-26' } satisfies DaySpan

/** Renders both charts across `SPAN`, with `RELEASES`, or with `props` in place of any of them. */
const renderCharts = (props?: Partial<ProjectChartsProps>) =>
  render(
    <ProjectCharts
      activity={ACTIVITY}
      downloads={DOWNLOADS}
      releases={RELEASES}
      span={SPAN}
      {...props}
    />
  )

/** Each chart's release lines' positions across it, the commits chart's first. */
const getReleaseXs = () =>
  [ACTIVITY_CHART, DOWNLOADS_CHART].map((chart) =>
    within(screen.getByTestId(chart))
      .queryAllByTestId(RELEASE)
      .map((line) => line.getAttribute('x1'))
  )

/** The plot of the chart with test id `chart`, which the wheel turns over. */
const getPlot = (chart: string) =>
  within(screen.getByTestId(chart)).getByTestId(PLOT)

describe('ProjectCharts', () => {
  it('shows the commits chart, then the downloads chart below it', () => {
    renderCharts()

    const activity = screen.getByTestId(ACTIVITY_CHART)
    const downloads = screen.getByTestId(DOWNLOADS_CHART)
    expect(
      activity.compareDocumentPosition(downloads) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('shows only the charts it has a history for', () => {
    renderCharts({ activity: undefined })

    expect(screen.queryByTestId(ACTIVITY_CHART)).toBeNull()
    expect(screen.getByTestId(DOWNLOADS_CHART)).toBeDefined()
  })

  it('spans both charts over the same dates, so each release lines up across them', () => {
    renderCharts()

    const [activityXs, downloadsXs] = getReleaseXs()
    expect(activityXs).toHaveLength(RELEASES.length)
    expect(downloadsXs).toEqual(activityXs)
  })

  it('zooms both charts together with the wheel over either, keeping the releases lined up', () => {
    renderCharts()
    const unzoomed = getReleaseXs()

    turnWheel(getPlot(DOWNLOADS_CHART), 100, -300)
    const zoomed = getReleaseXs()
    expect(zoomed).not.toEqual(unzoomed)
    // A release still in view, so there's a line to line up.
    expect(zoomed[0]).not.toHaveLength(0)
    expect(zoomed[1]).toEqual(zoomed[0])
  })

  it('pans both zoomed-in charts together', () => {
    renderCharts()
    turnWheel(getPlot(ACTIVITY_CHART), 100, -300)
    const zoomed = getReleaseXs()

    // A sideways scroll pans rather than zooms.
    turnWheel(getPlot(ACTIVITY_CHART), 100, 0, { deltaX: -40 })
    const panned = getReleaseXs()
    expect(panned).not.toEqual(zoomed)
    expect(panned[0]).not.toHaveLength(0)
    expect(panned[1]).toEqual(panned[0])
  })
})
