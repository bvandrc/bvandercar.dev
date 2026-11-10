import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { objectKeys } from 'ts-extras'

import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { RepoLink } from '../RepoLink'

const { REPO_LINK, COUNTS } = SELECTORS.PROJECTS

// A repo with counts, for the link to hold.
const REPO = objectKeys(REPO_COUNTS)[0]

/** Renders the link, and returns it. */
const renderLink = () => {
  renderWithProviders(<RepoLink repo={REPO} nameId="project-name" />)
  const link = screen.getByTestId(REPO_LINK)
  // jsdom can't open a link's new tab, so keep it from trying.
  link.addEventListener('click', (event) => event.preventDefault())
  return link
}

describe('RepoLink', () => {
  it("holds the repo's counts, so they're no tab stop of their own", () => {
    const link = renderLink()
    expect(within(link).getByTestId(COUNTS)).toBeDefined()
  })

  // Which focus opens it, and that it stays open through the scroll focus
  // brings, are useFocusVisibleOpen's own, tested in @bvandrc/react-toolkit.
  it("shows the counts' tooltip on keyboard focus", async () => {
    const user = userEvent.setup()
    const link = renderLink()

    await user.tab()
    expect(document.activeElement).toBe(link)
    // The open tooltip is the one describing the counts, not "repo".
    await waitFor(() =>
      expect(
        within(link).getByTestId(COUNTS).getAttribute('aria-describedby')
      ).toBe(screen.getByRole('tooltip').id)
    )
  })
})
