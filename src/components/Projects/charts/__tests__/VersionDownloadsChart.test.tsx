import { fireEvent, render, screen } from '@testing-library/react'

import { SELECTORS } from '~/test-support/selectors'
import { VersionDownloadsChart } from '../VersionDownloadsChart'

const { READOUT, ROW, BAR } = SELECTORS.PROJECTS.VERSION_DOWNLOADS_CHART

// 7 versions: 1.0.0 to 1.6.0, so 1.0.0 and 1.1.0 share the last bar.
const VERSION_DOWNLOADS = {
  '1.0.0': 2,
  '1.1.0': 1,
  '1.2.0': 20,
  '1.3.0': 120,
  '1.4.0': 1500,
  '1.5.0': 6000,
  '1.6.0': 12_357,
}

/** Renders the chart of `VERSION_DOWNLOADS`. */
const renderChart = () =>
  render(<VersionDownloadsChart versionDownloads={VERSION_DOWNLOADS} />)

describe('VersionDownloadsChart', () => {
  it('lists the most downloaded versions, most first, then the rest together in words, each shortened like the glyphs', () => {
    renderChart()

    expect(screen.getAllByTestId(ROW).map((row) => row.textContent)).toEqual([
      'v1.6.012.4K',
      'v1.5.06K',
      'v1.4.01.5K',
      'v1.3.0120',
      'v1.2.020',
      '2 other versions · 3',
    ])
  })

  it("draws each version's bar at its length beside the longest, and none for the rest, which could dwarf them", () => {
    renderChart()
    const bars = screen.getAllByTestId(BAR)

    expect(bars).toHaveLength(5)
    expect(bars[0].style.width).toBe('calc((100% - 3.25rem) * 1)')
    expect(bars[1].style.width).toBe(
      `calc((100% - 3.25rem) * ${6000 / 12_357})`
    )
  })

  it("captions itself, reads out a hovered bar's downloads in full with its share, and the caption again once it leaves", () => {
    renderChart()
    const readout = screen.getByTestId(READOUT)
    const [first, ...others] = screen.getAllByTestId(ROW)

    expect(readout.textContent).toBe('Downloads by version')
    fireEvent.pointerEnter(first)
    expect(readout.textContent).toBe('v1.6.0: 12,357 downloads, 62% of all')
    fireEvent.pointerEnter(others.at(-1) as HTMLElement)
    // 3 of 20,000, which rounds to no percent at all.
    expect(readout.textContent).toBe(
      '2 other versions: 3 downloads, <1% of all'
    )
    fireEvent.pointerLeave(others.at(-1) as HTMLElement)
    expect(readout.textContent).toBe('Downloads by version')
  })

  it('reads out a tapped bar, and keeps it once the finger lifts', () => {
    renderChart()
    const [first] = screen.getAllByTestId(ROW)

    fireEvent.pointerDown(first, { pointerType: 'touch' })
    fireEvent.pointerLeave(first, { pointerType: 'touch' })
    expect(screen.getByTestId(READOUT).textContent).toBe(
      'v1.6.0: 12,357 downloads, 62% of all'
    )
  })
})
