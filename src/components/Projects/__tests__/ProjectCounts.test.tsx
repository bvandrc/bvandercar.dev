import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type {
  Registry,
  Release,
  WeeklyDownloads,
} from '@/generated/package-downloads'
import type { REPO_COUNTS } from '@/generated/profile/repo-counts'
import type { WeeklyActivity } from '@/generated/repo-activity'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { ProjectCounts } from '../ProjectCounts'

const { COUNTS, ACTIVITY_CHART, DOWNLOADS_CHART } = SELECTORS.PROJECTS
const { TOOLTIP } = SELECTORS

// Hoisted with the mocks below, which run before the file's other top-level code.
const FIXTURES = vi.hoisted(() => ({
  REPO: 'some-repo',
  NEW_REPO: 'new-repo',
  OTHER_REPO: 'other-repo',
  SMALL_REPO: 'small-repo',
  NPM_PACKAGE: 'some-package',
  NEW_NPM_PACKAGE: 'new-package',
  PYPI_PACKAGE: 'some-python-package',
}))
const {
  REPO,
  NEW_REPO,
  OTHER_REPO,
  SMALL_REPO,
  NPM_PACKAGE,
  NEW_NPM_PACKAGE,
  PYPI_PACKAGE,
} = FIXTURES
const { PLOT, READOUT, TOTAL } = SELECTORS.PROJECTS.WEEKLY_CHART

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
    [FIXTURES.SMALL_REPO]: { commits: 12, prs: 2 },
  } satisfies typeof REPO_COUNTS,
}))

vi.mock('@/generated/repo-activity', () => ({
  REPO_ACTIVITY: {
    [FIXTURES.REPO]: {
      firstWeek: '2026-02-23',
      lastDay: '2026-03-12',
      commits: [3, 40, 12],
      prs: [1, 9, 4],
    },
    [FIXTURES.NEW_REPO]: {
      firstWeek: '2026-03-16',
      lastDay: '2026-03-18',
      commits: [2],
      prs: [1],
    },
    // Two weeks to chart, but fewer than 20 commits.
    [FIXTURES.SMALL_REPO]: {
      firstWeek: '2026-03-02',
      lastDay: '2026-03-12',
      commits: [5, 7],
      prs: [1, 1],
    },
  } satisfies Record<string, WeeklyActivity>,
}))

vi.mock('@/generated/package-downloads', () => ({
  PACKAGE_DOWNLOADS: {
    npm: {
      [FIXTURES.NPM_PACKAGE]: {
        firstDay: '2026-03-04',
        lastDay: '2026-03-24',
        weekly: [5, 1200, 12],
      },
      [FIXTURES.NEW_NPM_PACKAGE]: {
        firstDay: '2026-03-20',
        lastDay: '2026-03-24',
        weekly: [30],
      },
    },
    pypi: {
      [FIXTURES.PYPI_PACKAGE]: {
        firstDay: '2025-04-11',
        lastDay: '2026-03-24',
        weekly: [40, 900, 300],
      },
    },
  } satisfies Record<Registry, Record<string, WeeklyDownloads>>,
  PACKAGE_RELEASES: {
    npm: {
      [FIXTURES.NPM_PACKAGE]: [
        { version: '1.0.0', day: '2026-03-04' },
        { version: '1.1.0', day: '2026-03-12' },
      ],
    },
    pypi: {},
  } satisfies Record<Registry, Record<string, Release[]>>,
}))

/** Hovers the counts, and returns the tooltip once it opens. */
const hoverCounts = async () => {
  await userEvent.setup().hover(screen.getByTestId(COUNTS))
  return screen.findByTestId(TOOLTIP)
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

  it("keeps the profile's counts for a repo this site fetched nothing for", () => {
    renderWithProviders(<ProjectCounts repo={OTHER_REPO} />)

    expect(screen.getByTestId(COUNTS).getAttribute('aria-label')).toBe(
      '7 commits, 3 PRs'
    )
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

  it('charts nothing with a single week to show, leaving the counts alone', async () => {
    renderWithProviders(
      <ProjectCounts repo={NEW_REPO} npmPackage={NEW_NPM_PACKAGE} />
    )

    const tooltip = await hoverCounts()
    // Its downloads come from this site's fetch, though too few weeks to chart.
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
        .getAllByTestId(SELECTORS.PROJECTS.WEEKLY_CHART.RELEASE)
        .map((line) => line.getAttribute('x1'))
    )
    expect(downloadsLines).toEqual(activityLines)
  })

  it("starts both charts at the package's first release, rather than the repo's first commit", async () => {
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)

    await hoverCounts()
    const activity = within(screen.getByTestId(ACTIVITY_CHART))
    fireEvent.pointerMove(activity.getByTestId(PLOT), { clientX: 0 })
    // The first release, on Mar 4, falls in the repo's second week.
    expect(activity.getByTestId(READOUT).textContent).toBe(
      'Through Mar 8, 2026: 43 commits'
    )
  })

  it('starts a repo with no package where its commits reach 15', async () => {
    renderWithProviders(<ProjectCounts repo={REPO} />)

    await hoverCounts()
    const activity = within(screen.getByTestId(ACTIVITY_CHART))
    fireEvent.pointerMove(activity.getByTestId(PLOT), { clientX: 0 })
    // 3 commits the first week, then 43 by the end of the second.
    expect(activity.getByTestId(READOUT).textContent).toBe(
      'Through Mar 8, 2026: 43 commits'
    )
  })

  it('charts a repo with fewer than 20 commits only if it publishes a package', async () => {
    const CASES = [
      [<ProjectCounts key="alone" repo={SMALL_REPO} />, false],
      [
        <ProjectCounts
          key="published"
          repo={SMALL_REPO}
          npmPackage={NPM_PACKAGE}
        />,
        true,
      ],
    ] as const
    for (const [counts, charted] of CASES) {
      const { unmount } = renderWithProviders(counts)
      await hoverCounts()
      expect(
        screen.queryByTestId(ACTIVITY_CHART) !== null,
        `${counts.key}`
      ).toBe(charted)
      unmount()
    }
  })

  it("marks its package's releases on both charts", async () => {
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)

    await hoverCounts()
    // Both releases fall in weeks each chart covers, a week apart.
    for (const chart of [ACTIVITY_CHART, DOWNLOADS_CHART]) {
      expect(
        within(screen.getByTestId(chart)).getAllByTestId(
          SELECTORS.PROJECTS.WEEKLY_CHART.RELEASE
        ),
        chart
      ).toHaveLength(2)
    }
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
