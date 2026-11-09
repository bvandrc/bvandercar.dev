import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { objectKeys } from 'ts-extras'

import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { RepoLink } from '../RepoLink'

const { REPO_LINK, COUNTS } = SELECTORS.PROJECTS
const { TOOLTIP } = SELECTORS

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

  // The test DOM matches :focus-visible on any focus, a click's too, so
  // playwright/e2e/repo-link.spec.ts checks that a click opens none.
  it('shows the repo tooltip on keyboard focus', async () => {
    const user = userEvent.setup()
    const link = renderLink()

    await user.tab()
    expect(document.activeElement).toBe(link)
    expect((await screen.findByTestId(TOOLTIP)).textContent).toBe(
      'GitHub Repository'
    )
  })
})
