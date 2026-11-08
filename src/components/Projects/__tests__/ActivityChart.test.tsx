import { fireEvent, render, screen } from '@testing-library/react'

import type { CommitHistory } from '@/generated/repo-activity'
import { SELECTORS } from '~/test-support/selectors'
import { ActivityChart } from '../ActivityChart'

const { PLOT, READOUT, TOTAL } = SELECTORS.PROJECTS.RUNNING_TOTAL_CHART

// 3, 40, then 12 commits a week from Monday, Feb 23, read on Thursday,
// Mar 12, partway through its last week.
const ACTIVITY = {
  firstDay: '2026-02-23',
  lastDay: '2026-03-12',
  commits: [1, 0, 0, 1, 0, 1, 0, 5, 10, 0, 5, 10, 5, 5, 3, 4, 0, 5],
} satisfies CommitHistory

describe('ActivityChart', () => {
  it('charts the running total of commits, ending at them all', () => {
    render(<ActivityChart activity={ACTIVITY} />)

    expect(screen.getByTestId(READOUT).textContent).toBe('Commits')
    expect(screen.getByTestId(TOTAL).textContent).toBe('55')
  })

  it('reads out the week under way as through the day it was read', () => {
    render(<ActivityChart activity={ACTIVITY} />)

    fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX: 400 })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 12, 2026: 55 commits'
    )
  })

  it('reads out day by day across a span under 50 days', () => {
    render(
      <ActivityChart
        activity={ACTIVITY}
        span={{ start: ACTIVITY.firstDay, end: ACTIVITY.lastDay }}
      />
    )

    // 8 days into the 17 the plot spans.
    fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX: 136 })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 3, 2026: 18 commits'
    )
  })
})
