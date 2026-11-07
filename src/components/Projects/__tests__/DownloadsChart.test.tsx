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
  it('sums up the downloads, naming their registry, until hovered', () => {
    const CASES = [
      ['npm', 'Weekly npm downloads, peak 1,200'],
      ['pypi', 'Weekly PyPI downloads, peak 1,200'],
    ] as const
    for (const [registry, expected] of CASES) {
      const { unmount } = render(
        <DownloadsChart history={HISTORY} registry={registry} />
      )
      expect(screen.getByTestId(READOUT).textContent, registry).toBe(expected)
      unmount()
    }
  })

  it("reads out a hovered week's downloads from the day it starts", () => {
    render(<DownloadsChart history={HISTORY} registry="npm" />)

    // The first week, cut short by the first publish.
    fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX: 0 })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Week of Mar 6, 2026: 5 downloads'
    )
  })
})
