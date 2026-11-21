import { expect, type Locator, type Page, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { getChartedCounts } from '../support/charted-counts'

const { LINE_CHART } = SELECTORS
const { COMMITS_CHART, DOWNLOADS_CHART } = SELECTORS.PROJECTS

/** Moves the pointer onto the middle of a chart's plot. */
const hoverPlot = async (page: Page, chart: Locator) => {
  const plot = await chart.getByTestId(LINE_CHART.PLOT).boundingBox()
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
  const activity = tooltip.getByTestId(COMMITS_CHART)
  const downloads = tooltip.getByTestId(DOWNLOADS_CHART)
  // Each chart ends at the count its glyph shows, shortened the same way:
  // the fetched totals and histories agree, which fixtures can't show.
  for (const chart of [activity, downloads]) {
    const total = await chart.getByTestId(LINE_CHART.END_LABEL).textContent()
    await expect(counts).toContainText(total ?? '')
  }

  // The tooltip stays open as the pointer crosses into it, and between charts.
  await hoverPlot(page, activity)
  await expect(activity.getByTestId(LINE_CHART.CAPTION)).toHaveText(
    /^Through .+: [\d,]+ commits?$/
  )
  await hoverPlot(page, downloads)
  await expect(downloads.getByTestId(LINE_CHART.CAPTION)).toHaveText(
    /^Through .+: [\d,]+ downloads?$/
  )
})

test("the wheel zooms both of a project's charts around the pointer, without scrolling the page", async ({
  page,
}) => {
  await page.goto('/')

  await getChartedCounts(page).hover()
  const tooltip = page.getByTestId(SELECTORS.TOOLTIP)
  const totals = tooltip.getByTestId(LINE_CHART.END_LABEL)
  await expect(totals).toHaveCount(2)
  const scrollY = await page.evaluate(() => window.scrollY)

  await hoverPlot(page, tooltip.getByTestId(COMMITS_CHART))
  await page.mouse.wheel(0, -600)
  // Zoomed in around the middle, short of the lines' ends and their totals.
  await expect(totals).toHaveCount(0)
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY)

  await page.mouse.wheel(0, 2000)
  await expect(totals).toHaveCount(2)
})
