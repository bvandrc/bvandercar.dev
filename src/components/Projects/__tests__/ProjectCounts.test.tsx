import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { objectKeys } from 'ts-extras'

import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { ProjectCounts } from '../ProjectCounts'

const { COUNTS } = SELECTORS.PROJECTS
const { TOOLTIP } = SELECTORS

describe('ProjectCounts', () => {
  it('shows the counts shortened, and in full as its name and tooltip', async () => {
    const user = userEvent.setup()
    // A repo with downloads in the thousands, so they're shortened.
    const REPO = objectKeys(REPO_COUNTS).find(
      (repo) => (REPO_COUNTS[repo]?.downloads ?? 0) >= 1000
    )
    const REPO_COUNT = REPO ? REPO_COUNTS[REPO] : undefined
    if (!(REPO && REPO_COUNT?.downloads)) {
      throw new Error('No repo has downloads in the thousands')
    }
    const { commits, prs, downloads } = REPO_COUNT
    const LABEL = [
      formatCount(commits, 'commit'),
      formatCount(prs, 'PR'),
      formatCount(downloads, 'download'),
    ].join(', ')
    renderWithProviders(<ProjectCounts repo={REPO} />)
    const counts = screen.getByTestId(COUNTS)

    expect(counts.textContent).toContain(formatCompactCount(downloads))
    expect(counts.textContent).not.toContain('download')
    expect(counts.getAttribute('aria-label')).toBe(LABEL)
    await user.hover(counts)
    expect((await screen.findByTestId(TOOLTIP)).textContent).toBe(LABEL)
  })

  describe('in a link', () => {
    // Any repo with counts.
    const REPO = objectKeys(REPO_COUNTS)[0]

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
