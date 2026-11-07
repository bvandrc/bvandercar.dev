import { fireEvent, render, screen } from '@testing-library/react'

import type { WeeklyActivity } from '@/generated/repo-activity'
import { SELECTORS } from '~/test-support/selectors'
import { ActivityChart } from '../ActivityChart'

const { PLOT, READOUT, TOTAL } = SELECTORS.PROJECTS.WEEKLY_CHART

// Read on Thursday, Mar 12, partway through its last week.
const ACTIVITY = {
  firstWeek: '2026-02-23',
  lastDay: '2026-03-12',
  commits: [3, 40, 12],
  prs: [1, 9, 4],
} satisfies WeeklyActivity

describe('ActivityChart', () => {
  it('charts the running total of commits, ending at them all', () => {
    render(<ActivityChart activity={ACTIVITY} />)

    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Running total of commits'
    )
    expect(screen.getByTestId(TOTAL).textContent).toBe('55')
  })

  it('reads out the week under way as through the day it was read', () => {
    render(<ActivityChart activity={ACTIVITY} />)

    fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX: 400 })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 12, 2026: 55 commits'
    )
  })
})
