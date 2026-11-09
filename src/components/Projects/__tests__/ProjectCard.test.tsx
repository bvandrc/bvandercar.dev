import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PROJECTS, type Project } from '@/generated/profile/content/projects'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { ProjectCard } from '../ProjectCard'

const { LIVE_PREVIEW } = SELECTORS
const { CARD, BLURB, THUMBNAIL } = SELECTORS.PROJECTS

// Hoisted with the mocks below, which run before the file's other top-level code.
const { COUNTED_REPO } = vi.hoisted(() => ({ COUNTED_REPO: 'counted-repo' }))

vi.mock('@/generated/profile/repo-counts', async (importOriginal) => {
  const { REPO_COUNTS } =
    await importOriginal<typeof import('@/generated/profile/repo-counts')>()
  // Older than this site's fetch, as it would be.
  return {
    REPO_COUNTS: { ...REPO_COUNTS, [COUNTED_REPO]: { commits: 600, prs: 41 } },
  }
})

vi.mock('@/generated/repo-activity-totals', async (importOriginal) => {
  const { REPO_ACTIVITY_TOTALS } =
    await importOriginal<typeof import('@/generated/repo-activity-totals')>()
  return {
    REPO_ACTIVITY_TOTALS: {
      ...REPO_ACTIVITY_TOTALS,
      [COUNTED_REPO]: { commits: 600, prs: 587 },
    },
  }
})

const ALL_PROJECTS = PROJECTS.flatMap((group) => group.projects)

const renderCard = (project: Project, onPreviewOpen: () => void = vi.fn()) =>
  renderWithProviders(
    <ProjectCard
      project={project}
      centered={false}
      pulsePreview
      onPreviewOpen={onPreviewOpen}
    />
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
  it('fills its blurb with the counts its glyphs show, rounded down to the ten', () => {
    const PROJECT = {
      name: 'Counted',
      href: 'https://example.com/',
      type: ALL_PROJECTS[0].type,
      repo: COUNTED_REPO,
      blurb: 'Built over {prs}+ PRs.',
    } satisfies Project
    renderCard(PROJECT)

    // This site's fetch, not the profile's 41.
    expect(screen.getByTestId(BLURB).textContent).toBe('Built over 580+ PRs.')
  })

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

  it("shows a live preview's screenshot as a thumbnail, until the preview opens", async () => {
    const user = userEvent.setup()
    const card = renderPreviewCard()
    expect(within(card).getByTestId(THUMBNAIL).getAttribute('src')).toMatch(
      /^\/project-screenshots\/.+\.png$/
    )

    await user.click(within(card).getByTestId(LIVE_PREVIEW.TOGGLE))
    expect(within(card).queryByTestId(THUMBNAIL)).toBeNull()

    await user.click(within(card).getByTestId(LIVE_PREVIEW.TOGGLE))
    expect(within(card).getByTestId(THUMBNAIL)).toBeDefined()
  })

  it('shows a screenshot without a live preview at full width, not as a thumbnail', () => {
    const PROJECT = {
      name: 'Pictured',
      href: 'https://example.com/',
      type: ALL_PROJECTS[0].type,
      repo: COUNTED_REPO,
      blurb: 'A site that refuses framing.',
      screenshot: './project-screenshots/pictured.png',
    } satisfies Project
    renderCard(PROJECT)

    expect(screen.queryByTestId(THUMBNAIL)).toBeNull()
    expect(screen.getByAltText('Pictured screenshot')).toBeDefined()
  })
})
