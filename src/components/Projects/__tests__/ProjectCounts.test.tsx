import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { PACKAGE_DOWNLOAD_TOTALS } from '@/generated/package-download-totals'
import type {
  PACKAGE_DOWNLOADS,
  PACKAGE_RELEASES,
  PACKAGE_VERSION_DOWNLOADS,
} from '@/generated/package-downloads'
import type { REPO_COUNTS } from '@/generated/profile/repo-counts'
import type { REPO_ACTIVITY } from '@/generated/repo-activity'
import type { REPO_ACTIVITY_TOTALS } from '@/generated/repo-activity-totals'
import { renderWithProviders } from '@/test-helpers/render'
import { turnWheel } from '@/test-helpers/wheel'
import { SELECTORS } from '~/test-support/selectors'
import { ProjectCounts } from '../ProjectCounts'

const {
  COUNTS,
  COMMITS_CHART,
  DOWNLOADS_CHART,
  VERSION_DOWNLOADS_CHART,
  CHARTS_LOADING,
} = SELECTORS.PROJECTS
const { TOOLTIP } = SELECTORS

// Hoisted with the mocks below, which run before the file's other top-level code.
const FIXTURES = vi.hoisted(() => ({
  REPO: 'some-repo',
  NEW_REPO: 'new-repo',
  OTHER_REPO: 'other-repo',
  REVIEWED_REPO: 'reviewed-repo',
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
  REVIEWED_REPO,
  NPM_PACKAGE,
  NEW_NPM_PACKAGE,
  PYPI_PACKAGE,
} = FIXTURES
const { PLOT, CAPTION, END_LABEL, MARKER } = SELECTORS.LINE_CHART

// The repo's counts in full: its commits from this site's fetch, too few PRs
// to show, and its downloads from the profile's, with no package to fetch
// them for.
const LABEL = '55 commits, 3,120 downloads'

vi.mock('@/generated/profile/repo-counts', () => ({
  // Older than this site's fetches, which differ from them as they would.
  REPO_COUNTS: {
    [FIXTURES.REPO]: { commits: 25, prs: 31, downloads: 3120 },
    [FIXTURES.NEW_REPO]: { commits: 2, prs: 1 },
    [FIXTURES.OTHER_REPO]: { commits: 7, prs: 3 },
    // Many PRs, and most of its commits, so they show beside them.
    [FIXTURES.REVIEWED_REPO]: { commits: 667, prs: 587 },
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
      // No PRs merged.
      prs: Array.from({ length: 32 }, () => 0),
    },
    // Too few days to chart.
    [FIXTURES.NEW_REPO]: {
      firstDay: '2026-03-16',
      lastDay: '2026-03-18',
      commits: [1, 0, 1],
      // No PRs merged.
      prs: Array.from({ length: 3 }, () => 0),
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
  PACKAGE_VERSION_DOWNLOADS: {
    npm: {},
    pypi: {
      [FIXTURES.PYPI_PACKAGE]: {
        ALL: { '1.0': 7, '2.0': 1210 },
        LAST_YEAR: { '1.0': 7, '2.0': 1210 },
        LAST_30_DAYS: { '2.0': 30 },
        LAST_90_DAYS: { '2.0': 90 },
      },
    },
  } satisfies typeof PACKAGE_VERSION_DOWNLOADS,
}))

/** Hovers the counts, and returns the tooltip once it opens and any charts in it have loaded. */
const hoverCounts = async () => {
  await userEvent.setup().hover(screen.getByTestId(COUNTS))
  const tooltip = await screen.findByTestId(TOOLTIP)
  await waitFor(() => expect(screen.queryByTestId(CHARTS_LOADING)).toBeNull())
  return tooltip
}

/**
 * Leaves the focus a tap or click gives the counts without a focus ring, as a
 * browser does, so it doesn't hold their tooltip open.
 *
 * happy-dom matches `:focus-visible` on any focus, as if from the keyboard.
 */
const mockPressFocus = () => {
  const { matches } = Element.prototype
  const spy = vi
    .spyOn(Element.prototype, 'matches')
    .mockImplementation(function (this: Element, selector: string) {
      return selector !== ':focus-visible' && matches.call(this, selector)
    })
  onTestFinished(() => spy.mockRestore())
}

/** What screen readers hear for the open tooltip, sentence by sentence. */
const getTooltipSentences = () =>
  screen.getByRole('tooltip').textContent?.split('. ')

describe('ProjectCounts', () => {
  it('shows the counts shortened, and in full as the name of a button, which a press toggles the tooltip from', () => {
    renderWithProviders(<ProjectCounts repo={REPO} />)
    const counts = screen.getByTestId(COUNTS)

    expect(counts.textContent).toBe('553.1K')
    expect(screen.getByRole('button', { name: LABEL })).toBe(counts)
  })

  it('shows its PRs beside its commits where their rule does', () => {
    renderWithProviders(<ProjectCounts repo={REVIEWED_REPO} />)

    expect(screen.getByRole('button', { name: '667 commits, 587 PRs' })).toBe(
      screen.getByTestId(COUNTS)
    )
  })

  it("counts with this site's own fetches where it has them, so each chart ends at the count shown for it", async () => {
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)

    expect(
      screen.getByRole('button', { name: '55 commits, 1,217 downloads' })
    ).toBe(screen.getByTestId(COUNTS))
    await hoverCounts()
    const CASES = [
      [COMMITS_CHART, '55'],
      [DOWNLOADS_CHART, '1.2K'],
    ] as const
    for (const [chart, expected] of CASES) {
      expect(
        within(screen.getByTestId(chart)).getByTestId(END_LABEL).textContent,
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

    expect(screen.getByRole('button', { name: '7 commits' })).toBe(
      screen.getByTestId(COUNTS)
    )
    await userEvent.setup().hover(screen.getByTestId(COUNTS))
    expect((await screen.findByTestId(TOOLTIP)).textContent).toBe('7 commits')
    expect(loadCharts).not.toHaveBeenCalled()
  })

  it("charts the repo's commits in the tooltip in place of the counts, and describes them in words", async () => {
    renderWithProviders(<ProjectCounts repo={REPO} />)

    const tooltip = await hoverCounts()
    expect(tooltip.contains(screen.getByTestId(COMMITS_CHART))).toBe(true)
    expect(screen.queryByTestId(DOWNLOADS_CHART)).toBeNull()
    expect(within(tooltip).queryByText(LABEL)).toBeNull()
    // The counts in words, then the commits chart's description.
    expect(getTooltipSentences()).toEqual([
      LABEL,
      expect.stringMatching(/^Weekly commits /),
    ])
  })

  it("charts its npm package's downloads too, and describes both", async () => {
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)

    const tooltip = await hoverCounts()
    expect(tooltip.contains(screen.getByTestId(DOWNLOADS_CHART))).toBe(true)
    expect(getTooltipSentences()).toEqual([
      '55 commits, 1,217 downloads',
      expect.stringMatching(/^Weekly commits /),
      expect.stringMatching(/^Weekly npm downloads /),
    ])
  })

  it("charts its PyPI package's downloads too, named as PyPI's, then by version, and describes them", async () => {
    renderWithProviders(
      <ProjectCounts repo={REPO} pypiPackage={PYPI_PACKAGE} />
    )

    await hoverCounts()
    expect(
      within(screen.getByTestId(DOWNLOADS_CHART)).getByTestId(CAPTION)
        .textContent
    ).toBe('PyPI downloads')
    expect(
      screen
        .getAllByTestId(VERSION_DOWNLOADS_CHART.ROW)
        .map((row) => row.firstChild?.textContent)
    ).toEqual(['v2.0', 'v1.0'])
    expect(getTooltipSentences()?.at(-1)).toBe(
      'Most downloaded minor versions: v2.0 with 1,210 and v1.0 with 7'
    )
  })

  it('leaves the counts in words where there is nothing to chart', async () => {
    renderWithProviders(
      <ProjectCounts repo={NEW_REPO} npmPackage={NEW_NPM_PACKAGE} />
    )

    const tooltip = await hoverCounts()
    // Its downloads come from this site's fetch, though too few days to chart.
    expect(tooltip.textContent).toBe('2 commits, 30 downloads')
    expect(screen.queryByTestId(COMMITS_CHART)).toBeNull()
    expect(screen.queryByTestId(DOWNLOADS_CHART)).toBeNull()
  })

  it('starts both charts where getProjectCharts says, reading out each day across under 50', async () => {
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)

    await hoverCounts()
    const activity = within(screen.getByTestId(COMMITS_CHART))
    fireEvent.pointerMove(activity.getByTestId(PLOT), { clientX: 0 })
    // The first release, Mar 4: 3 commits the first week, then 15 more by then.
    expect(activity.getByTestId(CAPTION).textContent).toBe(
      'Through Mar 4, 2026: 18 commits'
    )
  })

  it('starts the charts zoomed out each time the tooltip opens', async () => {
    mockPressFocus()
    const user = userEvent.setup()
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)
    /** The activity chart's release lines' positions. */
    const getReleaseXs = () =>
      within(screen.getByTestId(COMMITS_CHART))
        .getAllByTestId(MARKER)
        .map((line) => line.getAttribute('x1'))

    await hoverCounts()
    const unzoomed = getReleaseXs()
    turnWheel(
      within(screen.getByTestId(COMMITS_CHART)).getByTestId(PLOT),
      100,
      -300
    )
    expect(getReleaseXs()).not.toEqual(unzoomed)

    // Taps close it, then open it again.
    const counts = screen.getByTestId(COUNTS)
    await user.pointer({ keys: '[TouchA]', target: counts })
    await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
    await user.pointer({ keys: '[TouchA]', target: counts })
    await screen.findByTestId(TOOLTIP)
    expect(getReleaseXs()).toEqual(unzoomed)
  })

  it('opens from outside its trigger, loading its charts, and still closes as any would', async () => {
    // A fresh copy, since the charts, once loaded, are kept for later counts.
    vi.resetModules()
    const { ProjectCounts: FreshCounts } = await import('../ProjectCounts')
    const user = userEvent.setup()
    renderWithProviders(<FreshCounts repo={REPO} open />)

    expect(await screen.findByTestId(COMMITS_CHART)).toBeTruthy()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
  })

  describe('on a press', () => {
    /** Renders the counts, and records whether each click on the page went on unhandled, as a card around them would see it. */
    const renderRecordingClicks = () => {
      const unhandled: boolean[] = []
      // On the document, so React's handlers have had their say first.
      const recordClick = (event: MouseEvent) =>
        unhandled.push(!event.defaultPrevented)
      document.addEventListener('click', recordClick)
      onTestFinished(() => document.removeEventListener('click', recordClick))
      renderWithProviders(<ProjectCounts repo={REPO} />)
      return unhandled
    }

    it('opens and closes the tooltip with a tap, which goes no further', async () => {
      mockPressFocus()
      const user = userEvent.setup()
      const unhandled = renderRecordingClicks()
      const counts = screen.getByTestId(COUNTS)

      await user.pointer({ keys: '[TouchA]', target: counts })
      expect(await screen.findByTestId(TOOLTIP)).toBeTruthy()
      await user.pointer({ keys: '[TouchA]', target: counts })
      await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
      expect(unhandled).toEqual([false, false])
    })

    it('keeps the tooltip hover opened on a click, and closes it on the next, which go no further', async () => {
      mockPressFocus()
      const user = userEvent.setup()
      const unhandled = renderRecordingClicks()
      const counts = screen.getByTestId(COUNTS)

      await user.hover(counts)
      await screen.findByTestId(TOOLTIP)
      await user.click(counts)
      expect(screen.getByTestId(TOOLTIP)).toBeTruthy()
      await user.click(counts)
      await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
      expect(unhandled).toEqual([false, false])
    })

    it('opens the tooltip on keyboard focus, as a tab stop of their own', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ProjectCounts repo={REPO} />)

      await user.tab()
      expect(document.activeElement).toBe(screen.getByTestId(COUNTS))
      expect(await screen.findByTestId(TOOLTIP)).toBeTruthy()
    })
  })

  it('closes on a press after opening from outside its trigger', async () => {
    mockPressFocus()
    const user = userEvent.setup()
    renderWithProviders(<ProjectCounts repo={REPO} open />)
    const counts = screen.getByTestId(COUNTS)

    await screen.findByTestId(TOOLTIP)
    await user.pointer({ keys: '[TouchA]', target: counts })
    await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
  })
})
