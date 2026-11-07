import { fireEvent, render, screen } from '@testing-library/react'

import type { WeeklyDownloads } from '@/generated/package-downloads'
import { SELECTORS } from '~/test-support/selectors'
import { DownloadsChart } from '../DownloadsChart'

const { PLOT, READOUT } = SELECTORS.PROJECTS.WEEKLY_CHART

const HISTORY = {
  firstDay: '2026-03-06',
  lastDay: '2026-03-24',
  weekly: [5, 1200, 12],
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
})
