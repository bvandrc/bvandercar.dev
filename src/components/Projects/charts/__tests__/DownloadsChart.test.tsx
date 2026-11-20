import { fireEvent, render, screen } from '@testing-library/react'

import type { DownloadHistory } from '~/counts'
import { SELECTORS } from '~/test-support/selectors'
import { DownloadsChart } from '../DownloadsChart'

const { PLOT, READOUT, RELEASE } = SELECTORS.PROJECTS.RUNNING_TOTAL_CHART

// 5, 1,200, then 12 downloads a week ending Mar 24.
const HISTORY = {
  firstDay: '2026-03-06',
  lastDay: '2026-03-24',
  daily: [
    1, 1, 1, 1, 1, 200, 300, 100, 200, 100, 200, 100, 2, 2, 2, 2, 2, 1, 1,
  ],
} satisfies DownloadHistory

describe('DownloadsChart', () => {
  it('captions itself with its registry as written in a sentence, and reads out the downloads through the last day of the hovered week', () => {
    render(<DownloadsChart history={HISTORY} registry="pypi" />)

    expect(screen.getByTestId(READOUT).textContent).toBe('PyPI downloads')
    fireEvent.pointerMove(screen.getByTestId(PLOT), { clientX: 400 })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'Through Mar 24, 2026: 1,217 downloads'
    )
  })

  it('captions itself as downloads alone without a registry, for downloads from more than one', () => {
    render(<DownloadsChart history={HISTORY} />)

    expect(screen.getByTestId(READOUT).textContent).toBe('Downloads')
  })

  it("reads out a hovered release's downloads, as counted for its version", () => {
    render(
      <DownloadsChart
        history={HISTORY}
        registry="pypi"
        releases={[{ version: '1.0.0', day: '2026-03-12' }]}
        versionDownloads={{ '1.0.0': 1210 }}
      />
    )

    fireEvent.pointerMove(screen.getByTestId(PLOT), {
      clientX: Number(screen.getByTestId(RELEASE).getAttribute('x1')),
    })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'v1.0.0 released Mar 12, 2026 · 1.2K'
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
