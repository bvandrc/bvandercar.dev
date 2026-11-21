import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PROJECTS, type Project } from '@/generated/profile/content/projects'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { ProjectCard } from '../ProjectCard'

const { LIVE_PREVIEW } = SELECTORS
const { CARD, BLURB, COUNTS, COMMITS_CHART, THUMBNAIL } = SELECTORS.PROJECTS
const { END_LABEL } = SELECTORS.LINE_CHART

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

vi.mock('@/generated/repo-activity', async (importOriginal) => {
  const { REPO_ACTIVITY } =
    await importOriginal<typeof import('@/generated/repo-activity')>()
  // Every commit and PR on its first day, then three quiet weeks, so it
  // spans the two weeks a chart needs.
  const QUIET_DAYS = Array.from({ length: 20 }, () => 0)
  return {
    REPO_ACTIVITY: {
      ...REPO_ACTIVITY,
      [COUNTED_REPO]: {
        firstDay: '2026-03-01',
        lastDay: '2026-03-21',
        commits: [600, ...QUIET_DAYS],
        prs: [587, ...QUIET_DAYS],
      },
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

  it("charts its repo's history in its counts' tooltip, ending at the count its glyph shows", async () => {
    const PROJECT = {
      name: 'Counted',
      href: 'https://example.com/',
      type: ALL_PROJECTS[0].type,
      repo: COUNTED_REPO,
      blurb: 'Counted.',
    } satisfies Project
    renderCard(PROJECT)
    const counts = screen.getByTestId(COUNTS)

    await userEvent.setup().hover(counts)
    const chart = await screen.findByTestId(COMMITS_CHART)
    const total = within(chart).getByTestId(END_LABEL).textContent
    expect(total).toBe('600')
    expect(counts.textContent).toContain(total)
  })

  it('opens its live preview on a click on the card, and closes it only from its toggle', async () => {
    const user = userEvent.setup()
    const onPreviewOpen = vi.fn()
    const card = renderPreviewCard(onPreviewOpen)

    await user.click(card)
    expect(within(card).getByTestId(LIVE_PREVIEW.FRAME)).toBeDefined()
    // So the page stops the toggles pulsing, as it would for the toggle.
    expect(onPreviewOpen).toHaveBeenCalledOnce()

    // As a click around the open page would be.
    await user.click(card)
    expect(within(card).getByTestId(LIVE_PREVIEW.FRAME)).toBeDefined()

    await user.click(within(card).getByTestId(LIVE_PREVIEW.TOGGLE))
    expect(within(card).queryByTestId(LIVE_PREVIEW.FRAME)).toBeNull()
  })

  it("shows a live preview's screenshot as a thumbnail, until the preview opens", async () => {
    const user = userEvent.setup()
    const card = renderPreviewCard()
    const thumbnail = within(card).getByTestId(THUMBNAIL)
    expect(thumbnail.getAttribute('src')).toMatch(
      /^\/project-screenshots\/.+\.480w\.webp$/
    )
    // Both widths, for the browser to pick from.
    expect(thumbnail.getAttribute('srcset')).toMatch(
      /\.480w\.webp 480w, \/.+\.900w\.webp 900w$/
    )
    // Below sm, its toggle shows only the top, cropped to just that, at the
    // same widths.
    expect(
      within(card).getByTestId(LIVE_PREVIEW.POSTER).getAttribute('srcset')
    ).toMatch(/\.poster\.480w\.webp 480w, \/.+\.poster\.900w\.webp 900w$/)

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
