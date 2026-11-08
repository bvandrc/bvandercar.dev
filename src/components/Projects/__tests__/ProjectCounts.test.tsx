import {
  createEvent,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { PACKAGE_DOWNLOAD_TOTALS } from '@/generated/package-download-totals'
import type {
  PACKAGE_DOWNLOADS,
  PACKAGE_RELEASES,
} from '@/generated/package-downloads'
import type { REPO_COUNTS } from '@/generated/profile/repo-counts'
import type { REPO_ACTIVITY } from '@/generated/repo-activity'
import type { REPO_ACTIVITY_TOTALS } from '@/generated/repo-activity-totals'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { ProjectCounts } from '../ProjectCounts'

const { COUNTS, ACTIVITY_CHART, DOWNLOADS_CHART, CHARTS_LOADING } =
  SELECTORS.PROJECTS
const { TOOLTIP } = SELECTORS

// Hoisted with the mocks below, which run before the file's other top-level code.
const FIXTURES = vi.hoisted(() => ({
  REPO: 'some-repo',
  NEW_REPO: 'new-repo',
  OTHER_REPO: 'other-repo',
  NPM_PACKAGE: 'some-package',
  NEW_NPM_PACKAGE: 'new-package',
  PYPI_PACKAGE: 'some-python-package',
  // Each day's downloads from Mar 4 to 24: 5, 1,200, then 12 a week.
  DAILY_DOWNLOADS: [
    1, 1, 1, 1, 1, 0, 0, 200, 300, 100, 200, 100, 200, 100, 2, 2, 2, 2, 2, 1, 1,
  ],
}))
const {
  REPO,
  NEW_REPO,
  OTHER_REPO,
  NPM_PACKAGE,
  NEW_NPM_PACKAGE,
  PYPI_PACKAGE,
} = FIXTURES
const { PLOT, READOUT, TOTAL } = SELECTORS.PROJECTS.RUNNING_TOTAL_CHART

// The repo's counts in full: its commits and PRs from this site's fetch, and
// its downloads from the profile's, with no package to fetch them for.
const LABEL = '55 commits, 14 PRs, 3,120 downloads'
const COMMITS_DESCRIPTION =
  'Weekly commits since Feb 2026, peaking at 40 in the week of Mar 2, 2026'

vi.mock('@/generated/profile/repo-counts', () => ({
  // Older than this site's fetches, which differ from them as they would.
  REPO_COUNTS: {
    [FIXTURES.REPO]: { commits: 25, prs: 31, downloads: 3120 },
    [FIXTURES.NEW_REPO]: { commits: 2, prs: 1 },
    [FIXTURES.OTHER_REPO]: { commits: 7, prs: 3 },
  } satisfies typeof REPO_COUNTS,
}))

vi.mock('@/generated/repo-activity-totals', () => ({
  REPO_ACTIVITY_TOTALS: {
    [FIXTURES.REPO]: { commits: 55, prs: 14 },
    [FIXTURES.NEW_REPO]: { commits: 2, prs: 1 },
  } satisfies typeof REPO_ACTIVITY_TOTALS,
}))

vi.mock('@/generated/repo-activity', () => ({
  REPO_ACTIVITY: {
    // 3, 40, then 12 commits a week from Monday, Feb 23, then two quiet
    // weeks, so it spans the two weeks a chart needs from where it starts.
    [FIXTURES.REPO]: {
      firstDay: '2026-02-23',
      lastDay: '2026-03-26',
      commits: [
        1, 0, 0, 1, 0, 1, 0, 5, 10, 0, 5, 10, 5, 5, 3, 4, 0, 5, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
    // Too few days to chart.
    [FIXTURES.NEW_REPO]: {
      firstDay: '2026-03-16',
      lastDay: '2026-03-18',
      commits: [1, 0, 1],
    },
  } satisfies typeof REPO_ACTIVITY,
}))

vi.mock('@/generated/package-download-totals', () => ({
  PACKAGE_DOWNLOAD_TOTALS: {
    npm: { [FIXTURES.NPM_PACKAGE]: 1217, [FIXTURES.NEW_NPM_PACKAGE]: 30 },
    pypi: { [FIXTURES.PYPI_PACKAGE]: 1217 },
  } satisfies typeof PACKAGE_DOWNLOAD_TOTALS,
}))

vi.mock('@/generated/package-downloads', () => ({
  PACKAGE_DOWNLOADS: {
    npm: {
      [FIXTURES.NPM_PACKAGE]: {
        firstDay: '2026-03-04',
        lastDay: '2026-03-24',
        daily: FIXTURES.DAILY_DOWNLOADS,
      },
      // Too few days to chart.
      [FIXTURES.NEW_NPM_PACKAGE]: {
        firstDay: '2026-03-20',
        lastDay: '2026-03-24',
        daily: [10, 5, 5, 5, 5],
      },
    },
    pypi: {
      [FIXTURES.PYPI_PACKAGE]: {
        firstDay: '2026-03-04',
        lastDay: '2026-03-24',
        daily: FIXTURES.DAILY_DOWNLOADS,
      },
    },
  } satisfies typeof PACKAGE_DOWNLOADS,
  PACKAGE_RELEASES: {
    npm: {
      [FIXTURES.NPM_PACKAGE]: [
        { version: '1.0.0', day: '2026-03-04' },
        { version: '1.1.0', day: '2026-03-12' },
      ],
    },
    pypi: {},
  } satisfies typeof PACKAGE_RELEASES,
}))

/** Turns the wheel over `target` at `clientX`, with any other `init`, returning whether the page would scroll. */
const turnWheel = (
  target: Element,
  clientX: number,
  deltaY: number,
  init?: WheelEventInit
) => {
  const event = createEvent.wheel(target, { deltaY })
  // The test DOM's WheelEvent drops a clientX or deltaX passed in, which a
  // browser's keeps.
  for (const [key, value] of Object.entries({ clientX, ...init })) {
    Object.defineProperty(event, key, { value })
  }
  return fireEvent(target, event)
}

/** Hovers the counts, and returns the tooltip once it opens and any charts in it have loaded. */
const hoverCounts = async () => {
  await userEvent.setup().hover(screen.getByTestId(COUNTS))
  const tooltip = await screen.findByTestId(TOOLTIP)
  await waitFor(() => expect(screen.queryByTestId(CHARTS_LOADING)).toBeNull())
  return tooltip
}

/** Asserts `later` comes after `earlier` in the page, so is shown below it. */
const expectFollows = (later: Element, earlier: Element) =>
  expect(
    earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy()

describe('ProjectCounts', () => {
  it('shows the counts shortened, and in full as its name', () => {
    renderWithProviders(<ProjectCounts repo={REPO} />)
    const counts = screen.getByTestId(COUNTS)

    expect(counts.textContent).toBe('55143.1K')
    expect(counts.getAttribute('aria-label')).toBe(LABEL)
  })

  it("counts with this site's own fetches where it has them, so each chart ends at the count shown for it", async () => {
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)

    expect(screen.getByTestId(COUNTS).getAttribute('aria-label')).toBe(
      '55 commits, 14 PRs, 1,217 downloads'
    )
    await hoverCounts()
    const CASES = [
      [ACTIVITY_CHART, '55'],
      [DOWNLOADS_CHART, '1.2K'],
    ] as const
    for (const [chart, expected] of CASES) {
      expect(
        within(screen.getByTestId(chart)).getByTestId(TOTAL).textContent,
        chart
      ).toBe(expected)
    }
  })

  it("keeps the profile's counts in words for a repo this site fetched nothing for, with no charts to load", async () => {
    // A fresh copy, since the charts, once loaded, are kept for later counts,
    // with their module watched for being loaded.
    vi.resetModules()
    const loadCharts = vi.fn()
    vi.doMock('../lib/project-charts', (importOriginal) => {
      loadCharts()
      return importOriginal()
    })
    onTestFinished(() => vi.doUnmock('../lib/project-charts'))
    const { ProjectCounts: FreshCounts } = await import('../ProjectCounts')
    renderWithProviders(<FreshCounts repo={OTHER_REPO} />)

    expect(screen.getByTestId(COUNTS).getAttribute('aria-label')).toBe(
      '7 commits, 3 PRs'
    )
    await userEvent.setup().hover(screen.getByTestId(COUNTS))
    expect((await screen.findByTestId(TOOLTIP)).textContent).toBe(
      '7 commits, 3 PRs'
    )
    expect(loadCharts).not.toHaveBeenCalled()
  })

  it("charts the repo's commits in the tooltip in place of the counts, and describes them in words", async () => {
    renderWithProviders(<ProjectCounts repo={REPO} />)

    const tooltip = await hoverCounts()
    expect(tooltip.contains(screen.getByTestId(ACTIVITY_CHART))).toBe(true)
    expect(screen.queryByTestId(DOWNLOADS_CHART)).toBeNull()
    expect(within(tooltip).queryByText(LABEL)).toBeNull()
    expect(screen.getByRole('tooltip').textContent).toBe(
      `${LABEL}. ${COMMITS_DESCRIPTION}`
    )
  })

  it("charts its npm package's downloads below the commits, and describes both", async () => {
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)

    const tooltip = await hoverCounts()
    const activity = screen.getByTestId(ACTIVITY_CHART)
    const downloads = screen.getByTestId(DOWNLOADS_CHART)
    expect(tooltip.contains(downloads)).toBe(true)
    expectFollows(downloads, activity)
    expect(screen.getByRole('tooltip').textContent).toBe(
      `55 commits, 14 PRs, 1,217 downloads. ${COMMITS_DESCRIPTION}. Weekly npm downloads since Mar 2026, peaking at 1,200 in the week of Mar 11, 2026`
    )
  })

  it("charts its PyPI package's downloads too, named as PyPI's", async () => {
    renderWithProviders(
      <ProjectCounts repo={REPO} pypiPackage={PYPI_PACKAGE} />
    )

    await hoverCounts()
    expect(
      within(screen.getByTestId(DOWNLOADS_CHART)).getByTestId(READOUT)
        .textContent
    ).toBe('PyPI downloads')
  })

  it('leaves the counts in words where there is nothing to chart', async () => {
    renderWithProviders(
      <ProjectCounts repo={NEW_REPO} npmPackage={NEW_NPM_PACKAGE} />
    )

    const tooltip = await hoverCounts()
    // Its downloads come from this site's fetch, though too few days to chart.
    expect(tooltip.textContent).toBe('2 commits, 1 PR, 30 downloads')
    expect(screen.queryByTestId(ACTIVITY_CHART)).toBeNull()
    expect(screen.queryByTestId(DOWNLOADS_CHART)).toBeNull()
  })

  it('spans both charts over the same dates, so each release lines up across them', async () => {
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)

    await hoverCounts()
    const [activityLines, downloadsLines] = [
      ACTIVITY_CHART,
      DOWNLOADS_CHART,
    ].map((chart) =>
      within(screen.getByTestId(chart))
        .getAllByTestId(SELECTORS.PROJECTS.RUNNING_TOTAL_CHART.RELEASE)
        .map((line) => line.getAttribute('x1'))
    )
    expect(activityLines).toHaveLength(2)
    expect(downloadsLines).toEqual(activityLines)
  })

  it('starts both charts where getProjectCharts says, reading out each day across under 50', async () => {
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)

    await hoverCounts()
    const activity = within(screen.getByTestId(ACTIVITY_CHART))
    fireEvent.pointerMove(activity.getByTestId(PLOT), { clientX: 0 })
    // The first release, Mar 4: 3 commits the first week, then 15 more by then.
    expect(activity.getByTestId(READOUT).textContent).toBe(
      'Through Mar 4, 2026: 18 commits'
    )
  })

  it('zooms both charts together with the wheel, and back out once the tooltip closes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)
    /** Each chart's release lines' positions, activity first. */
    const getReleaseXs = () =>
      [ACTIVITY_CHART, DOWNLOADS_CHART].map((chart) =>
        within(screen.getByTestId(chart))
          .getAllByTestId(SELECTORS.PROJECTS.RUNNING_TOTAL_CHART.RELEASE)
          .map((line) => line.getAttribute('x1'))
      )

    await hoverCounts()
    const unzoomed = getReleaseXs()
    turnWheel(
      within(screen.getByTestId(ACTIVITY_CHART)).getByTestId(PLOT),
      100,
      -300
    )
    const zoomed = getReleaseXs()
    expect(zoomed).not.toEqual(unzoomed)
    // Still lined up across the two.
    expect(zoomed[1]).toEqual(zoomed[0])

    // Taps close it, then open it again.
    const counts = screen.getByTestId(COUNTS)
    await user.pointer({ keys: '[TouchA]', target: counts })
    await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
    await user.pointer({ keys: '[TouchA]', target: counts })
    await screen.findByTestId(TOOLTIP)
    expect(getReleaseXs()).toEqual(unzoomed)
  })

  it('pans both zoomed-in charts together, and not ones zoomed all the way out', async () => {
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)
    /** The first release line's position in each chart, activity first. */
    const getFirstReleaseXs = () =>
      [ACTIVITY_CHART, DOWNLOADS_CHART].map((chart) =>
        within(screen.getByTestId(chart))
          .queryAllByTestId(SELECTORS.PROJECTS.RUNNING_TOTAL_CHART.RELEASE)[0]
          ?.getAttribute('x1')
      )
    const plot = () =>
      within(screen.getByTestId(ACTIVITY_CHART)).getByTestId(PLOT)

    await hoverCounts()
    const unzoomed = getFirstReleaseXs()
    turnWheel(plot(), 100, 0, { deltaX: 40 })
    expect(getFirstReleaseXs()).toEqual(unzoomed)

    turnWheel(plot(), 100, -300)
    const zoomed = getFirstReleaseXs()
    // To the left, so later.
    turnWheel(plot(), 100, 0, { deltaX: -40 })
    const panned = getFirstReleaseXs()
    expect(panned).not.toEqual(zoomed)
    expect(panned[1]).toEqual(panned[0])
  })

  describe('in a link', () => {
    /** Renders the counts in a link, and records whether each click on the page goes on to follow it. */
    const renderInLink = () => {
      const followed: boolean[] = []
      // On the document, so React's handlers have had their say first.
      const recordClick = (event: MouseEvent) =>
        followed.push(!event.defaultPrevented)
      document.addEventListener('click', recordClick)
      onTestFinished(() => document.removeEventListener('click', recordClick))
      renderWithProviders(
        <a href="https://example.com">
          <ProjectCounts repo={REPO} />
        </a>
      )
      return followed
    }

    it('opens and closes the tooltip with a tap, rather than following the link', async () => {
      const user = userEvent.setup()
      const followed = renderInLink()
      const counts = screen.getByTestId(COUNTS)

      await user.pointer({ keys: '[TouchA]', target: counts })
      expect(await screen.findByTestId(TOOLTIP)).toBeTruthy()
      await user.pointer({ keys: '[TouchA]', target: counts })
      await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
      expect(followed).toEqual([false, false])
    })

    it('follows the link on a mouse click', async () => {
      const followed = renderInLink()

      await userEvent.setup().click(screen.getByTestId(COUNTS))
      expect(followed).toEqual([true])
    })
  })
})
