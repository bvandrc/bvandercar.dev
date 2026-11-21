import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { objectKeys } from 'ts-extras'

import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { CountsAndRepoLink } from '../CountsAndRepoLink'

const { REPO_LINK, COUNTS } = SELECTORS.PROJECTS

// A repo with counts, for the link to hold.
const REPO = objectKeys(REPO_COUNTS)[0]

/** Renders the link, and returns it. */
const renderLink = () => {
  renderWithProviders(<CountsAndRepoLink repo={REPO} nameId="project-name" />)
  const link = screen.getByTestId(REPO_LINK)
  // jsdom can't open a link's new tab, so keep it from trying.
  link.addEventListener('click', (event) => event.preventDefault())
  return link
}

describe('CountsAndRepoLink', () => {
  it('links "repo" to the repo, and leaves the counts out of the link, so a press on them only toggles their tooltip', () => {
    const link = renderLink()

    expect(link.textContent?.trim()).toBe('repo')
    expect(link.getAttribute('href')).toMatch(new RegExp(`/${REPO}$`))
    expect(screen.getByTestId(COUNTS).closest('a')).toBeNull()
  })

  it('tabs to the counts, showing their tooltip, then to the link', async () => {
    const user = userEvent.setup()
    const link = renderLink()
    const counts = screen.getByTestId(COUNTS)

    await user.tab()
    expect(document.activeElement).toBe(counts)
    await waitFor(() =>
      expect(counts.getAttribute('aria-describedby')).toBe(
        screen.getByRole('tooltip').id
      )
    )
    await user.tab()
    expect(document.activeElement).toBe(link)
  })

  it("opens the counts' tooltip as openCounts turns true, as for a URL asking for their charts", async () => {
    const { rerender } = renderWithProviders(
      <CountsAndRepoLink repo={REPO} nameId="project-name" />
    )
    expect(screen.queryByRole('tooltip')).toBeNull()

    rerender(<CountsAndRepoLink repo={REPO} nameId="project-name" openCounts />)
    await waitFor(() =>
      expect(screen.getByTestId(COUNTS).getAttribute('aria-describedby')).toBe(
        screen.getByRole('tooltip').id
      )
    )
  })

  it("shows a private repo's counts with no link, which would 404", () => {
    renderWithProviders(
      <CountsAndRepoLink repo={REPO} privateRepo nameId="project-name" />
    )

    expect(screen.getByTestId(COUNTS)).toBeDefined()
    expect(screen.queryByTestId(REPO_LINK)).toBeNull()
  })
})
