import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { RepoLink } from '../RepoLink'

describe('RepoLink', () => {
  it('links "repo" to the GitHub repo in a new tab, described by the project\'s name', () => {
    renderWithProviders(
      <>
        <span id="project-name">Some Project</span>
        <RepoLink repo="some-repo" nameId="project-name" />
      </>
    )
    const link = screen.getByTestId(SELECTORS.PROJECTS.REPO_LINK)

    expect(link).toMatchObject({
      textContent: 'repo ',
      href: expect.stringMatching(/\/some-repo$/),
      target: '_blank',
    })
    expect(link.getAttribute('aria-describedby')).toBe('project-name')
  })
})
