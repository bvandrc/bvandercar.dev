import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { RepoLink } from '../RepoLink'

/** Renders the link beside the project's name, and returns the link. */
const renderLink = () => {
  renderWithProviders(
    <>
      <span id="project-name">Some Project</span>
      <RepoLink repo="some-repo" nameId="project-name" />
    </>
  )
  return screen.getByTestId(SELECTORS.PROJECTS.REPO_LINK)
}

describe('RepoLink', () => {
  it('links "repo" to the GitHub repo in a new tab, described by the project\'s name', () => {
    const link = renderLink()

    expect(link).toMatchObject({
      textContent: 'repo ',
      href: expect.stringMatching(/\/some-repo$/),
      target: '_blank',
    })
    expect(link.getAttribute('aria-describedby')).toBe('project-name')
  })

  it('shows its tooltip on keyboard focus, still described by the name too', async () => {
    const link = renderLink()

    await userEvent.setup().tab()
    expect(document.activeElement).toBe(link)
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip.textContent).toBe('GitHub Repository')
    expect(link.getAttribute('aria-describedby')?.split(' ')).toEqual([
      'project-name',
      tooltip.id,
    ])
  })
})
