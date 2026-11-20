import { render, screen } from '@testing-library/react'

import { SELECTORS } from '~/test-support/selectors'
import { VersionDownloadsChart } from '../VersionDownloadsChart'

const { ROW, BAR, SHARE } = SELECTORS.PROJECTS.VERSION_DOWNLOADS_CHART

// 7 versions, 20,000 downloads: 1.0.0 and 1.1.0 share the last row.
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

/** Each row's cells' text: its name, its downloads, and its share. */
const getRowCells = () =>
  screen
    .getAllByTestId(ROW)
    .map((row) => Array.from(row.children, (cell) => cell.textContent))

describe('VersionDownloadsChart', () => {
  it('lists the most downloaded versions, most first, then the rest together in words, each shortened like the glyphs, with its share on the right', () => {
    renderChart()

    expect(getRowCells()).toEqual([
      ['v1.6.0', '12.4K', '62%'],
      ['v1.5.0', '6K', '30%'],
      ['v1.4.0', '1.5K', '8%'],
      ['v1.3.0', '120', '1%'],
      // 20 of 20,000, which rounds to no percent at all.
      ['v1.2.0', '20', '<1%'],
      ['2 other versions · 3', '<1%'],
    ])
    expect(screen.getAllByTestId(SHARE)).toHaveLength(6)
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
})
