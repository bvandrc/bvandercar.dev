import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PROJECTS, type Project } from '@/generated/profile/content/projects'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { ProjectCard } from '../ProjectCard'

const { LIVE_PREVIEW } = SELECTORS
const { CARD, NAME, BLURB } = SELECTORS.PROJECTS

// Hoisted with the mocks below, which run before the file's other top-level code.
const { COUNTED_REPO, FEW_COUNTS_REPO } = vi.hoisted(() => ({
  COUNTED_REPO: 'counted-repo',
  FEW_COUNTS_REPO: 'few-counts-repo',
}))

vi.mock('@/generated/profile/repo-counts', async (importOriginal) => {
  const { REPO_COUNTS } =
    await importOriginal<typeof import('@/generated/profile/repo-counts')>()
  // Older than this site's fetch, as it would be.
  return {
    REPO_COUNTS: {
      ...REPO_COUNTS,
      [COUNTED_REPO]: { commits: 600, prs: 41 },
      // Too few PRs to show, so its commits show alone.
      [FEW_COUNTS_REPO]: { commits: 7, prs: 3 },
    },
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
  it('shrinks its name only where it and its counts are too long to fit together', () => {
    const PROJECT = {
      name: 'Counted',
      href: 'https://example.com/',
      type: ALL_PROJECTS[0].type,
      repo: COUNTED_REPO,
      blurb: 'Counted.',
    } satisfies Project
    const LONG_NAME = 'a-name-twenty-six-letters!'
    const CASES = [
      // 7 letters, and 600 commits and 587 PRs, 5 each with their icons.
      [PROJECT.name, COUNTED_REPO, 'text-lg'],
      // 26 letters beside those counts.
      [LONG_NAME, COUNTED_REPO, 'text-base'],
      // 26 letters beside its 7 commits alone, 3 with their icon.
      [LONG_NAME, FEW_COUNTS_REPO, 'text-lg'],
    ] as const
    for (const [name, repo, expected] of CASES) {
      const { unmount } = renderCard({ ...PROJECT, name, repo })
      expect(
        screen.getByTestId(NAME).className,
        `${name} in ${repo}`
      ).toContain(expected)
      unmount()
    }
  })

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
})
