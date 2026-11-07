import { screen, waitFor, within } from '@testing-library/react'
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
  NPM_PACKAGE: 'some-package',
  NEW_NPM_PACKAGE: 'new-package',
  PYPI_PACKAGE: 'some-python-package',
}))
const { REPO, NEW_REPO, NPM_PACKAGE, NEW_NPM_PACKAGE, PYPI_PACKAGE } = FIXTURES

// What the repo's counts read as in full.
const LABEL = '25 commits, 31 PRs, 3,120 downloads'
const ACTIVITY_DESCRIPTION =
  'Weekly commits and PRs since Feb 2026, peaking at 40 commits in the week of Mar 2, 2026'

vi.mock('@/generated/profile/repo-counts', () => ({
  REPO_COUNTS: {
    [FIXTURES.REPO]: { commits: 25, prs: 31, downloads: 3120 },
    [FIXTURES.NEW_REPO]: { commits: 2, prs: 1 },
  } satisfies typeof REPO_COUNTS,
}))

vi.mock('@/generated/repo-activity', () => ({
  REPO_ACTIVITY: {
    [FIXTURES.REPO]: {
      firstWeek: '2026-02-23',
      commits: [3, 40, 12],
      prs: [1, 9, 4],
    },
    [FIXTURES.NEW_REPO]: { firstWeek: '2026-03-16', commits: [2], prs: [1] },
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

    expect(counts.textContent).toBe('25313.1K')
    expect(counts.getAttribute('aria-label')).toBe(LABEL)
  })

  it("charts the repo's activity in the tooltip, above the counts, and describes it in words", async () => {
    renderWithProviders(<ProjectCounts repo={REPO} />)

    const tooltip = await hoverCounts()
    expect(tooltip.contains(screen.getByTestId(ACTIVITY_CHART))).toBe(true)
    expectFollows(screen.getByText(LABEL), screen.getByTestId(ACTIVITY_CHART))
    expect(screen.queryByTestId(DOWNLOADS_CHART)).toBeNull()
    expect(screen.getByRole('tooltip').textContent).toBe(
      `${LABEL}. ${ACTIVITY_DESCRIPTION}`
    )
  })

  it("charts its npm package's downloads below the activity, and describes both", async () => {
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)

    const tooltip = await hoverCounts()
    const activity = screen.getByTestId(ACTIVITY_CHART)
    const downloads = screen.getByTestId(DOWNLOADS_CHART)
    expect(tooltip.contains(downloads)).toBe(true)
    expectFollows(downloads, activity)
    expect(screen.getByRole('tooltip').textContent).toBe(
      `${LABEL}. ${ACTIVITY_DESCRIPTION}. Weekly npm downloads since Mar 2026, peaking at 1,200 in the week of Mar 11, 2026`
    )
  })

  it("charts its PyPI package's downloads too, named as PyPI's", async () => {
    renderWithProviders(
      <ProjectCounts repo={REPO} pypiPackage={PYPI_PACKAGE} />
    )

    await hoverCounts()
    expect(screen.getByTestId(DOWNLOADS_CHART).textContent).toBe(
      'Running total of PyPI downloads'
    )
  })

  it('charts nothing with a single week to show, leaving the counts alone', async () => {
    renderWithProviders(
      <ProjectCounts repo={NEW_REPO} npmPackage={NEW_NPM_PACKAGE} />
    )

    const tooltip = await hoverCounts()
    expect(tooltip.textContent).toBe('2 commits, 1 PR')
    expect(screen.queryByTestId(ACTIVITY_CHART)).toBeNull()
    expect(screen.queryByTestId(DOWNLOADS_CHART)).toBeNull()
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
