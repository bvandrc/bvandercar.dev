import { render, screen } from '@testing-library/react'

import type { ChartPeriod, VersionDownloads } from '~/counts'
import { SELECTORS } from '~/test-support/selectors'
import { VersionDownloadsChart } from '../VersionDownloadsChart'

const { SELF, ROW, BAR, SHARE } = SELECTORS.PROJECTS.VERSION_DOWNLOADS_CHART

const VERSION_DOWNLOADS = {
  // 7 minor versions, 20,000 downloads: 1.0 and 1.1 share the last row.
  ALL: {
    '1.0': 2,
    '1.1': 1,
    '1.2': 20,
    '1.3': 120,
    '1.4': 1500,
    '1.5': 6000,
    '1.6': 12_357,
  },
  LAST_30_DAYS: {},
  LAST_90_DAYS: { '1.5': 100, '1.6': 300 },
} satisfies VersionDownloads

/** Renders the chart of `VERSION_DOWNLOADS`, barring `period`'s, all time unless given. */
const renderChart = (period: ChartPeriod = 'ALL') =>
  render(
    <VersionDownloadsChart
      versionDownloads={VERSION_DOWNLOADS}
      period={period}
    />
  )

/** Each row's cells' text: its name, its downloads, and its share. */
const getRowCells = () =>
  screen
    .queryAllByTestId(ROW)
    .map((row) => Array.from(row.children, (cell) => cell.textContent))

describe('VersionDownloadsChart', () => {
  it('lists the most downloaded minor versions, most first, then the rest together in words, each shortened like the glyphs, with its share on the right', () => {
    renderChart()

    expect(getRowCells()).toEqual([
      ['v1.6', '12.4K', '62%'],
      ['v1.5', '6K', '30%'],
      ['v1.4', '1.5K', '8%'],
      ['v1.3', '120', '1%'],
      // 20 of 20,000, which rounds to no percent at all.
      ['v1.2', '20', '<1%'],
      ['2 other minor versions · 3', '<1%'],
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

  it("bars the period's downloads, and says so where it had none", () => {
    const { unmount } = renderChart('LAST_90_DAYS')

    expect(getRowCells()).toEqual([
      ['v1.6', '300', '75%'],
      ['v1.5', '100', '25%'],
    ])
    unmount()
    renderChart('LAST_30_DAYS')
    expect(getRowCells()).toEqual([])
    expect(screen.getByTestId(SELF).textContent).toContain(
      'No downloads in this period'
    )
  })
})
