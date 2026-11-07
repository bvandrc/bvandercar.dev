import { fireEvent, render, screen } from '@testing-library/react'

import type { WeeklyDownloads } from '@/generated/npm-downloads'
import { SELECTORS } from '~/test-support/selectors'
import { DownloadsChart } from '../DownloadsChart'

const { PLOT, READOUT } = SELECTORS.PROJECTS.DOWNLOADS_CHART

const HISTORY = {
  firstDay: '2026-03-06',
  lastDay: '2026-03-24',
  weekly: [5, 1200, 12],
} satisfies WeeklyDownloads

/** Moves the pointer to `clientX` on the plot, which the test DOM lays out from x = 0. */
const movePointer = (clientX: number) =>
  fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX })

describe('DownloadsChart', () => {
  it('reads out the peak week until hovered', () => {
    render(<DownloadsChart history={HISTORY} />)

    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Weekly npm downloads, peak 1,200'
    )
  })

  it('labels its first and last months', () => {
    render(<DownloadsChart history={{ ...HISTORY, lastDay: '2026-05-24' }} />)

    expect(
      screen.getByTestId(SELECTORS.PROJECTS.DOWNLOADS_CHART.SELF).textContent
    ).toMatch(/Mar 2026.*May 2026/)
  })

  it('reads out the week nearest the pointer, and the peak again once it leaves', () => {
    render(<DownloadsChart history={HISTORY} />)
    const readout = screen.getByTestId(READOUT)

    // Past either end of the plot clamps to its first or last week.
    const CASES = [
      [-20, 'Week of Mar 6, 2026: 5 downloads'],
      // Closer to the middle week than to either end.
      [100, 'Week of Mar 11, 2026: 1,200 downloads'],
      [400, 'Week of Mar 18, 2026: 12 downloads'],
    ] as const
    for (const [clientX, expected] of CASES) {
      movePointer(clientX)
      expect(readout.textContent, String(clientX)).toBe(expected)
    }

    fireEvent.pointerLeave(screen.getByTestId(PLOT))
    expect(readout.textContent).toBe('Weekly npm downloads, peak 1,200')
  })
})
