import { expect, type Locator, type Page, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { getChartedCounts } from '../support/charted-counts'

const { ACTIVITY_CHART, DOWNLOADS_CHART, WEEKLY_CHART } = SELECTORS.PROJECTS

/** Moves the pointer onto the middle of a chart's plot. */
const hoverPlot = async (page: Page, chart: Locator) => {
  const plot = await chart.getByTestId(WEEKLY_CHART.PLOT).boundingBox()
  if (!plot) {
    throw new Error('The chart has no box')
  }
  await page.mouse.move(plot.x + plot.width / 2, plot.y + plot.height / 2, {
    steps: 10,
  })
}

test("hovering a project's counts charts its commits and npm downloads as running totals, read out week by week", async ({
  page,
}) => {
  await page.goto('/')

  const counts = getChartedCounts(page)
  await counts.hover()
  const tooltip = page.getByTestId(SELECTORS.TOOLTIP)
  const activity = tooltip.getByTestId(ACTIVITY_CHART)
  const downloads = tooltip.getByTestId(DOWNLOADS_CHART)
  await expect(activity.getByTestId(WEEKLY_CHART.READOUT)).toHaveText(
    'Running total of commits'
  )
  await expect(downloads.getByTestId(WEEKLY_CHART.READOUT)).toHaveText(
    'Running total of npm downloads'
  )
  // Each chart ends at the count its glyph shows.
  const label = await counts.getAttribute('aria-label')
  for (const [chart, noun] of [
    [activity, 'commit'],
    [downloads, 'download'],
  ] as const) {
    const total = await chart.getByTestId(WEEKLY_CHART.TOTAL).textContent()
    expect(label, noun).toMatch(new RegExp(`\\b${total} ${noun}s?\\b`))
  }

  // The tooltip stays open as the pointer crosses into it, and between charts.
  await hoverPlot(page, activity)
  await expect(activity.getByTestId(WEEKLY_CHART.READOUT)).toHaveText(
    /^Through .+: [\d,]+ commits?$/
  )
  await hoverPlot(page, downloads)
  await expect(downloads.getByTestId(WEEKLY_CHART.READOUT)).toHaveText(
    /^Through .+: [\d,]+ downloads?$/
  )
})
