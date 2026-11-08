import { fireEvent, render, screen } from '@testing-library/react'

import type { WeeklyDownloads } from '@/generated/package-downloads'
import { SELECTORS } from '~/test-support/selectors'
import { DownloadsChart } from '../DownloadsChart'

const { PLOT, READOUT } = SELECTORS.PROJECTS.RUNNING_TOTAL_CHART

const HISTORY = {
  firstDay: '2026-03-06',
  lastDay: '2026-03-24',
  weekly: [5, 1200, 12],
  // Each day from the first, adding up to the weeks'.
  daily: [
    1, 1, 1, 1, 1, 200, 300, 100, 200, 100, 200, 100, 2, 2, 2, 2, 2, 1, 1,
  ],
} satisfies WeeklyDownloads

describe('DownloadsChart', () => {
  it('names the registry its running total is of, until hovered', () => {
    const CASES = [
      ['npm', 'npm downloads'],
      ['pypi', 'PyPI downloads'],
    ] as const
    for (const [registry, expected] of CASES) {
      const { unmount } = render(
        <DownloadsChart history={HISTORY} registry={registry} />
      )
      expect(screen.getByTestId(READOUT).textContent, registry).toBe(expected)
      unmount()
    }
  })

  it('reads out the downloads through the last day of the hovered week', () => {
    render(<DownloadsChart history={HISTORY} registry="npm" />)

    fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX: 400 })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 24, 2026: 1,217 downloads'
    )
  })

  it('reads out day by day across a span under 50 days', () => {
    render(
      <DownloadsChart
        history={HISTORY}
        registry="npm"
        span={{ start: HISTORY.firstDay, end: HISTORY.lastDay }}
      />
    )

    // 6 days into the 18 the plot spans.
    fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX: 98 })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 12, 2026: 505 downloads'
    )
  })
})
