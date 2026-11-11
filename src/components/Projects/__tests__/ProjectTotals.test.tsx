import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { PACKAGE_DOWNLOAD_TOTALS } from '@/generated/package-download-totals'
import type {
  PACKAGE_DOWNLOADS,
  PACKAGE_RELEASES,
} from '@/generated/package-downloads'
import type { ProjectSection } from '@/generated/profile/content/projects'
import type { REPO_COUNTS } from '@/generated/profile/repo-counts'
import type { REPO_ACTIVITY } from '@/generated/repo-activity'
import type { REPO_ACTIVITY_TOTALS } from '@/generated/repo-activity-totals'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { ProjectTotals } from '../ProjectTotals'

const { TOTALS, COMMITS_CHART, PRS_CHART, DOWNLOADS_CHART, CHARTS_LOADING } =
  SELECTORS.PROJECTS
const { TOTAL } = SELECTORS.PROJECTS.RUNNING_TOTAL_CHART
const { TOOLTIP } = SELECTORS

// Hoisted with the mocks below, which run before the file's other top-level code.
const FIXTURES = vi.hoisted(() => ({
  REPO: 'some-repo',
  SITE_REPO: 'site-repo',
  NPM_PACKAGE: 'some-package',
}))

// Every project's counts in full, added up.
const LABEL = '1,021 commits, 60 PRs, 1,217 downloads'

vi.mock('@/generated/profile/content/projects', async (importOriginal) => ({
  ...(await importOriginal()),
  PROJECTS: [
    {
      icon: { slug: 'react', color: '61DAFB' },
      title: 'Some Group',
      projects: [
        {
          name: 'Some Project',
          href: 'https://example.com/some-project',
          type: 'react',
          repo: FIXTURES.REPO,
          npmPackage: FIXTURES.NPM_PACKAGE,
          blurb: 'Some project.',
        },
        {
          name: 'Some Site',
          href: 'https://example.com',
          type: 'react',
          repo: FIXTURES.SITE_REPO,
          blurb: 'Some site.',
        },
      ],
    },
  ] satisfies ProjectSection[],
}))

// The account's own commits and PRs, unfetched, so the projects' add up.
vi.mock('@/generated/account-activity-totals', () => ({
  ACCOUNT_ACTIVITY_TOTALS: undefined,
}))
vi.mock('@/generated/account-activity', () => ({ ACCOUNT_ACTIVITY: undefined }))

vi.mock('@/generated/profile/repo-counts', () => ({
  // Older than this site's fetches, which differ from them as they would.
  REPO_COUNTS: {
    [FIXTURES.REPO]: { commits: 20, prs: 10, downloads: 1000 },
    [FIXTURES.SITE_REPO]: { commits: 900, prs: 40 },
  } satisfies typeof REPO_COUNTS,
}))

vi.mock('@/generated/repo-activity-totals', () => ({
  REPO_ACTIVITY_TOTALS: {
    [FIXTURES.REPO]: { commits: 21, prs: 11 },
    [FIXTURES.SITE_REPO]: { commits: 1000, prs: 49 },
  } satisfies typeof REPO_ACTIVITY_TOTALS,
}))

vi.mock('@/generated/repo-activity', () => ({
  REPO_ACTIVITY: {
    // A commit a day, and a PR every other day, for three weeks from Mar 2.
    [FIXTURES.REPO]: {
      firstDay: '2026-03-02',
      lastDay: '2026-03-22',
      commits: Array.from({ length: 21 }, () => 1),
      prs: Array.from({ length: 21 }, (_, index) => (index % 2 === 0 ? 1 : 0)),
    },
    // 1,000 commits and 49 PRs, a day after the other's first.
    [FIXTURES.SITE_REPO]: {
      firstDay: '2026-03-03',
      lastDay: '2026-03-22',
      commits: [1000, ...Array.from({ length: 19 }, () => 0)],
      prs: [49, ...Array.from({ length: 19 }, () => 0)],
    },
  } satisfies typeof REPO_ACTIVITY,
}))

vi.mock('@/generated/package-download-totals', () => ({
  PACKAGE_DOWNLOAD_TOTALS: {
    npm: { [FIXTURES.NPM_PACKAGE]: 1217 },
    pypi: {},
  } satisfies typeof PACKAGE_DOWNLOAD_TOTALS,
}))

vi.mock('@/generated/package-downloads', () => ({
  PACKAGE_DOWNLOADS: {
    npm: {
      [FIXTURES.NPM_PACKAGE]: {
        firstDay: '2026-03-04',
        lastDay: '2026-03-20',
        daily: [1097, ...Array.from({ length: 16 }, (_, index) => index)],
      },
    },
    pypi: {},
  } satisfies typeof PACKAGE_DOWNLOADS,
  PACKAGE_RELEASES: {
    npm: { [FIXTURES.NPM_PACKAGE]: [{ version: '1.0.0', day: '2026-03-04' }] },
    pypi: {},
  } satisfies typeof PACKAGE_RELEASES,
}))

/** Renders the totals, and returns their link. */
const renderTotals = () => {
  renderWithProviders(<ProjectTotals />)
  return screen.getByTestId(TOTALS.LINK)
}

/** Waits for the open tooltip's charts to load, and returns the tooltip. */
const findLoadedTooltip = async () => {
  const tooltip = await screen.findByTestId(TOOLTIP)
  await waitFor(() => expect(screen.queryByTestId(CHARTS_LOADING)).toBeNull())
  return tooltip
}

describe('ProjectTotals', () => {
  it("shows every project's counts added up, shortened, and in full as their name, linking up to the projects", () => {
    const link = renderTotals()
    const counts = within(link).getByTestId(TOTALS.COUNTS)

    expect(counts).toMatchObject({ textContent: '1K601.2K' })
    expect(counts.getAttribute('aria-label')).toBe(LABEL)
    expect(link.getAttribute('href')).toBe('#projects')
    // Bracketed as a whole.
    expect(link.textContent).toMatch(/^\[.+across projects\]$/)
  })

  it('charts the commits, merged PRs, and downloads across every project on hover, each ending at the total shown, and describes them', async () => {
    renderTotals()

    await userEvent.setup().hover(screen.getByTestId(TOTALS.COUNTS))
    const tooltip = await findLoadedTooltip()
    const CASES = [
      [COMMITS_CHART, '1K'],
      [PRS_CHART, '60'],
      [DOWNLOADS_CHART, '1.2K'],
    ] as const
    for (const [chart, expected] of CASES) {
      expect(
        within(within(tooltip).getByTestId(chart)).getByTestId(TOTAL)
          .textContent,
        chart
      ).toBe(expected)
    }
    expect(screen.getByRole('tooltip').textContent?.split('. ')).toEqual([
      LABEL,
      expect.stringMatching(/^Weekly commits /),
      expect.stringMatching(/^Weekly PRs /),
      expect.stringMatching(/^Weekly downloads /),
    ])
  })

  it('charts them on hovering the words beside them too', async () => {
    renderTotals()

    await userEvent.setup().hover(screen.getByTestId(TOTALS.WORDS))
    const tooltip = await findLoadedTooltip()
    expect(within(tooltip).getByTestId(COMMITS_CHART)).toBeDefined()
  })

  // Which focus opens it is useFocusVisibleOpen's own, tested in
  // @bvandrc/react-toolkit.
  it('shows the charts on keyboard focus on the link', async () => {
    const link = renderTotals()

    await userEvent.setup().tab()
    expect(document.activeElement).toBe(link)
    const tooltip = await findLoadedTooltip()
    expect(within(tooltip).getByTestId(COMMITS_CHART)).toBeDefined()
  })
})
