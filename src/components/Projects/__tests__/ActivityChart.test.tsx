import { fireEvent, render, screen } from '@testing-library/react'

import type { WeeklyActivity } from '@/generated/repo-activity'
import { SELECTORS } from '~/test-support/selectors'
import { ActivityChart } from '../ActivityChart'

const { PLOT, READOUT } = SELECTORS.PROJECTS.WEEKLY_CHART

const ACTIVITY = {
  firstWeek: '2026-02-23',
  commits: [3, 40, 12],
  prs: [1, 9, 4],
} satisfies WeeklyActivity

describe('ActivityChart', () => {
  it('names its commits and PRs lines until hovered', () => {
    render(<ActivityChart activity={ACTIVITY} />)

    expect(screen.getByTestId(READOUT).textContent).toBe('WeeklycommitsPRs')
  })

  it("reads out a hovered week's commits and PRs", () => {
    render(<ActivityChart activity={ACTIVITY} />)

    fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX: 400 })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Week of Mar 9, 2026: 12 commits, 4 PRs'
    )
  })
})
