import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PROJECTS, type Project } from '@/generated/profile/content/projects'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { ProjectCard } from '../ProjectCard'

const { LIVE_PREVIEW } = SELECTORS
const { CARD } = SELECTORS.PROJECTS

const ALL_PROJECTS = PROJECTS.flatMap((group) => group.projects)

const renderCard = (project: Project, onPreviewOpen: () => void = vi.fn()) =>
  renderWithProviders(
    <ProjectCard project={project} pulsePreview onPreviewOpen={onPreviewOpen} />
  )

/** Renders a card with a live preview, and returns it. */
const renderPreviewCard = (onPreviewOpen?: () => void) => {
  const project = ALL_PROJECTS.find(({ embed }) => embed)
  if (!project) {
    throw new Error('No project has a live preview')
  }
  renderCard(project, onPreviewOpen)
  return screen.getByTestId(CARD)
}

describe('ProjectCard', () => {
  it('toggles its live preview on a click on the card', async () => {
    const user = userEvent.setup()
    const onPreviewOpen = vi.fn()
    const card = renderPreviewCard(onPreviewOpen)

    await user.click(card)
    expect(within(card).getByTestId(LIVE_PREVIEW.FRAME)).toBeDefined()
    // So the page stops the toggles pulsing, as it would for the toggle.
    expect(onPreviewOpen).toHaveBeenCalledOnce()

    await user.click(card)
    expect(within(card).queryByTestId(LIVE_PREVIEW.FRAME)).toBeNull()
  })
})
