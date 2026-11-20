import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { turnWheel } from '@/test-helpers/wheel'
import type { ActivityHistory, DownloadHistory, Release } from '~/counts'
import { SELECTORS } from '~/test-support/selectors'
import type { DaySpan } from '../lib/spans'
import { ProjectCharts, type ProjectChartsProps } from '../ProjectCharts'

const {
  COMMITS_CHART,
  PRS_CHART,
  DOWNLOADS_CHART,
  RUNNING_TOTAL_CHART,
  VERSION_DOWNLOADS_CHART,
  CHART_PERIOD,
} = SELECTORS.PROJECTS
const { PLOT, RELEASE } = RUNNING_TOTAL_CHART

// 3, 40, then 12 commits a week from Monday, Feb 23, then quiet to Mar 26,
// with a merged PR a week.
const ACTIVITY = {
  firstDay: '2026-02-23',
  lastDay: '2026-03-26',
  commits: [
    1, 0, 0, 1, 0, 1, 0, 5, 10, 0, 5, 10, 5, 5, 3, 4, 0, 5, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ],
  prs: [
    1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    0, 0, 0, 1, 0, 0, 0,
  ],
} satisfies ActivityHistory

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
  [COMMITS_CHART, DOWNLOADS_CHART].map((chart) =>
    within(screen.getByTestId(chart))
      .queryAllByTestId(RELEASE)
      .map((line) => line.getAttribute('x1'))
  )

/** The period buttons' labels, and which one is chosen, if any. */
const getPeriods = () =>
  screen
    .getAllByTestId(CHART_PERIOD)
    .map((button) => [button.textContent, button.getAttribute('aria-pressed')])

/** Clicks the period button that says `label`, like "Last 30 days". */
const clickPeriod = (label: string) => {
  const button = screen
    .getAllByTestId(CHART_PERIOD)
    .find((period) => period.textContent === label)
  if (!button) {
    throw new Error(`No period button says ${label}`)
  }
  return userEvent.setup().click(button)
}

/** The minor versions the versions chart bars, most downloaded first. */
const getBarredVersions = () =>
  screen
    .getAllByTestId(VERSION_DOWNLOADS_CHART.ROW)
    .map((row) => row.firstChild?.textContent)

/** The plot of the chart with test id `chart`, which the wheel turns over. */
const getPlot = (chart: string) =>
  within(screen.getByTestId(chart)).getByTestId(PLOT)

describe('ProjectCharts', () => {
  it('shows the commits chart, then the downloads chart below it', () => {
    renderCharts()

    const activity = screen.getByTestId(COMMITS_CHART)
    const downloads = screen.getByTestId(DOWNLOADS_CHART)
    expect(
      activity.compareDocumentPosition(downloads) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('shows the merged PRs chart between the commits and downloads charts', () => {
    renderCharts({ prs: ACTIVITY })

    const prs = screen.getByTestId(PRS_CHART)
    expect(
      screen.getByTestId(COMMITS_CHART).compareDocumentPosition(prs) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      prs.compareDocumentPosition(screen.getByTestId(DOWNLOADS_CHART)) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('shows only the charts it has a history for', () => {
    renderCharts({ activity: undefined })

    expect(screen.queryByTestId(COMMITS_CHART)).toBeNull()
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

  it('opens zoomed in on its initial span, and zooms back out to the full one', () => {
    // Past the first release, so only the second is in view.
    renderCharts({ initialSpan: { start: '2026-03-10', end: '2026-03-26' } })
    expect(getReleaseXs().map((xs) => xs.length)).toEqual([1, 1])

    turnWheel(getPlot(COMMITS_CHART), 100, 3000)
    expect(getReleaseXs().map((xs) => xs.length)).toEqual([2, 2])
  })

  it('pans both zoomed-in charts together', () => {
    renderCharts()
    turnWheel(getPlot(COMMITS_CHART), 100, -300)
    const zoomed = getReleaseXs()

    // A sideways scroll pans rather than zooms.
    turnWheel(getPlot(COMMITS_CHART), 100, 0, { deltaX: -40 })
    const panned = getReleaseXs()
    expect(panned).not.toEqual(zoomed)
    expect(panned[0]).not.toHaveLength(0)
    expect(panned[1]).toEqual(panned[0])
  })

  it("switches every chart between all time, which it opens on, and the last 30 or 90 days: the line charts' span, and the versions' downloads", async () => {
    renderCharts({
      // Since Dec 1, so 30 and 90 days each zoom in.
      span: { start: '2025-12-01', end: '2026-03-26' },
      downloads: {
        ...DOWNLOADS,
        versionDownloads: {
          ALL: { '1.0': 1000, '1.1': 217 },
          LAST_30_DAYS: { '1.0': 1, '1.1': 9 },
          LAST_90_DAYS: { '1.0': 100, '1.1': 217 },
        },
      },
    })
    const allTime = getReleaseXs()

    expect(getPeriods()).toEqual([
      ['All time', 'true'],
      ['Last 90 days', 'false'],
      ['Last 30 days', 'false'],
    ])
    expect(getBarredVersions()).toEqual(['v1.0', 'v1.1'])
    await clickPeriod('Last 30 days')
    const last30 = getReleaseXs()
    expect(last30).not.toEqual(allTime)
    // Both releases, Mar 4 and 12, are within the last 30 days, lined up.
    expect(last30[0]).toHaveLength(2)
    expect(last30[1]).toEqual(last30[0])
    expect(getBarredVersions()).toEqual(['v1.1', 'v1.0'])
    await clickPeriod('Last 90 days')
    expect(getReleaseXs()).not.toEqual(last30)
    await clickPeriod('All time')
    expect(getReleaseXs()).toEqual(allTime)
  })

  it('opens on its initial span with no period chosen, until one is', async () => {
    renderCharts({ initialSpan: { start: '2026-03-10', end: '2026-03-26' } })

    expect(getPeriods().map(([, pressed]) => pressed)).toEqual([
      'false',
      'false',
      'false',
    ])
    await clickPeriod('All time')
    expect(getReleaseXs().map((xs) => xs.length)).toEqual([2, 2])
  })
})
