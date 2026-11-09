import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { PACKAGE_DOWNLOAD_TOTALS } from '@/generated/package-download-totals'
import type { REPO_COUNTS } from '@/generated/profile/repo-counts'
import type { REPO_ACTIVITY_TOTALS } from '@/generated/repo-activity-totals'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { ProjectCounts } from '../ProjectCounts'

const { COUNTS } = SELECTORS.PROJECTS
const { TOOLTIP } = SELECTORS

// Hoisted with the mocks below, which run before the file's other top-level code.
const FIXTURES = vi.hoisted(() => ({
  REPO: 'some-repo',
  OTHER_REPO: 'other-repo',
  NPM_PACKAGE: 'some-package',
}))
const { REPO, OTHER_REPO, NPM_PACKAGE } = FIXTURES

vi.mock('@/generated/profile/repo-counts', () => ({
  // Older than this site's fetches, which differ from them as they would.
  REPO_COUNTS: {
    [FIXTURES.REPO]: { commits: 25, prs: 31, downloads: 3120 },
    [FIXTURES.OTHER_REPO]: { commits: 7, prs: 3 },
  } satisfies typeof REPO_COUNTS,
}))

vi.mock('@/generated/repo-activity-totals', () => ({
  REPO_ACTIVITY_TOTALS: {
    [FIXTURES.REPO]: { commits: 55, prs: 14 },
  } satisfies typeof REPO_ACTIVITY_TOTALS,
}))

vi.mock('@/generated/package-download-totals', () => ({
  PACKAGE_DOWNLOAD_TOTALS: {
    npm: { [FIXTURES.NPM_PACKAGE]: 1217 },
    pypi: {},
  } satisfies typeof PACKAGE_DOWNLOAD_TOTALS,
}))

describe('ProjectCounts', () => {
  it('shows the counts shortened, and in full as its name and tooltip', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProjectCounts repo={REPO} />)
    const counts = screen.getByTestId(COUNTS)
    // Its commits and PRs from this site's fetch, and its downloads from the
    // profile's, with no package to fetch them for.
    const LABEL = '55 commits, 14 PRs, 3,120 downloads'

    expect(counts.textContent).toBe('55143.1K')
    expect(counts.getAttribute('aria-label')).toBe(LABEL)
    await user.hover(counts)
    expect((await screen.findByTestId(TOOLTIP)).textContent).toBe(LABEL)
  })

  it("counts with this site's own fetches where it has them", () => {
    renderWithProviders(<ProjectCounts repo={REPO} npmPackage={NPM_PACKAGE} />)

    expect(screen.getByTestId(COUNTS).getAttribute('aria-label')).toBe(
      '55 commits, 14 PRs, 1,217 downloads'
    )
  })

  it("keeps the profile's counts for a repo this site fetched nothing for", () => {
    renderWithProviders(<ProjectCounts repo={OTHER_REPO} />)

    expect(screen.getByTestId(COUNTS).getAttribute('aria-label')).toBe(
      '7 commits, 3 PRs'
    )
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
