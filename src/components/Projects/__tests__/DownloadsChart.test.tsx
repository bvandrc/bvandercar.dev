import { fireEvent, render, screen } from '@testing-library/react'

import type { WeeklyDownloads } from '~/counts'
import { SELECTORS } from '~/test-support/selectors'
import { DownloadsChart } from '../DownloadsChart'

const { PLOT, READOUT } = SELECTORS.PROJECTS.WEEKLY_CHART

const HISTORY = {
  firstDay: '2026-03-06',
  lastDay: '2026-03-24',
  weekly: [5, 1200, 12],
} satisfies WeeklyDownloads

describe('DownloadsChart', () => {
  it('captions itself with its registry as written in a sentence, and reads out the downloads through the last day of the hovered week', () => {
    render(<DownloadsChart history={HISTORY} registry="pypi" />)

    expect(screen.getByTestId(READOUT).textContent).toBe('PyPI downloads')
    fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX: 400 })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 24, 2026: 1,217 downloads'
    )
  })
})
