import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { objectKeys } from 'ts-extras'

import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { ProjectCounts } from '../ProjectCounts'

const { COUNTS } = SELECTORS.PROJECTS
const { TOOLTIP } = SELECTORS

describe('ProjectCounts', () => {
  it('shows the counts shortened, and in full as its name and tooltip', async () => {
    const user = userEvent.setup()
    // A repo with downloads in the thousands, so they're shortened.
    const REPO = objectKeys(REPO_COUNTS).find(
      (repo) => (REPO_COUNTS[repo]?.downloads ?? 0) >= 1000
    )
    const REPO_COUNT = REPO ? REPO_COUNTS[REPO] : undefined
    if (!(REPO && REPO_COUNT?.downloads)) {
      throw new Error('No repo has downloads in the thousands')
    }
    const { commits, prs, downloads } = REPO_COUNT
    const LABEL = [
      formatCount(commits, 'commit'),
      formatCount(prs, 'PR'),
      formatCount(downloads, 'download'),
    ].join(', ')
    renderWithProviders(<ProjectCounts repo={REPO} />)
    const counts = screen.getByTestId(COUNTS)

    expect(counts.textContent).toContain(formatCompactCount(downloads))
    expect(counts.textContent).not.toContain('download')
    expect(counts.getAttribute('aria-label')).toBe(LABEL)
    await user.hover(counts)
    expect((await screen.findByTestId(TOOLTIP)).textContent).toBe(LABEL)
  })
})
