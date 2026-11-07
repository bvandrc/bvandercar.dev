import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { objectKeys } from 'ts-extras'

import type { WeeklyDownloads } from '@/generated/npm-downloads'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { ProjectCounts } from '../ProjectCounts'

const { COUNTS, DOWNLOADS_CHART } = SELECTORS.PROJECTS
const { TOOLTIP } = SELECTORS

// Hoisted with the mock below, which runs before the file's other top-level code.
const { NPM_PACKAGE, SINGLE_WEEK_PACKAGE } = vi.hoisted(() => ({
  NPM_PACKAGE: 'some-package',
  SINGLE_WEEK_PACKAGE: 'new-package',
}))

vi.mock('@/generated/npm-downloads', () => ({
  NPM_DOWNLOADS: {
    [NPM_PACKAGE]: {
      firstDay: '2026-03-04',
      lastDay: '2026-03-24',
      weekly: [5, 1200, 12],
    },
    [SINGLE_WEEK_PACKAGE]: {
      firstDay: '2026-03-20',
      lastDay: '2026-03-24',
      weekly: [30],
    },
  } satisfies Record<string, WeeklyDownloads>,
}))

/** A repo with downloads in the thousands, so they're shortened, and the label its counts read as in full. */
const getRepoWithDownloads = () => {
  const repo = objectKeys(REPO_COUNTS).find(
    (name) => (REPO_COUNTS[name]?.downloads ?? 0) >= 1000
  )
  const counts = repo ? REPO_COUNTS[repo] : undefined
  if (!(repo && counts?.downloads)) {
    throw new Error('No repo has downloads in the thousands')
  }
  const { commits, prs, downloads } = counts
  const label = [
    formatCount(commits, 'commit'),
    formatCount(prs, 'PR'),
    formatCount(downloads, 'download'),
  ].join(', ')
  return { repo, downloads, label }
}

describe('ProjectCounts', () => {
  it('shows the counts shortened, and in full as its name and tooltip', async () => {
    const user = userEvent.setup()
    const { repo, downloads, label } = getRepoWithDownloads()
    renderWithProviders(<ProjectCounts repo={repo} />)
    const counts = screen.getByTestId(COUNTS)

    expect(counts.textContent).toContain(formatCompactCount(downloads))
    expect(counts.textContent).not.toContain('download')
    expect(counts.getAttribute('aria-label')).toBe(label)
    await user.hover(counts)
    expect((await screen.findByTestId(TOOLTIP)).textContent).toBe(label)
  })

  it("charts its npm package's weekly downloads in the tooltip, and describes them in words", async () => {
    const user = userEvent.setup()
    const { repo, label } = getRepoWithDownloads()
    renderWithProviders(<ProjectCounts repo={repo} npmPackage={NPM_PACKAGE} />)
    const counts = screen.getByTestId(COUNTS)

    await user.hover(counts)
    const tooltip = await screen.findByTestId(TOOLTIP)
    expect(tooltip.textContent).toContain(label)
    expect(
      screen
        .getByTestId(DOWNLOADS_CHART.SELF)
        .closest(`[data-testid="${TOOLTIP}"]`)
    ).toBe(tooltip)
    expect(screen.getByRole('tooltip').textContent).toBe(
      `${label}. Weekly npm downloads since Mar 2026, peaking at 1,200 in the week of Mar 11, 2026`
    )
  })

  it('charts nothing for a package with a single week of downloads', async () => {
    const user = userEvent.setup()
    const { repo, label } = getRepoWithDownloads()
    renderWithProviders(
      <ProjectCounts repo={repo} npmPackage={SINGLE_WEEK_PACKAGE} />
    )

    await user.hover(screen.getByTestId(COUNTS))
    expect((await screen.findByTestId(TOOLTIP)).textContent).toBe(label)
    expect(screen.queryByTestId(DOWNLOADS_CHART.SELF)).toBeNull()
  })
})
