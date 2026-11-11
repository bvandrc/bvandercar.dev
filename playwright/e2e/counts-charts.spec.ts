import { expect, type Locator, type Page, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { getChartedCounts } from '../support/charted-counts'

const { COMMITS_CHART, DOWNLOADS_CHART, RUNNING_TOTAL_CHART } =
  SELECTORS.PROJECTS

/** Moves the pointer onto the middle of a chart's plot. */
const hoverPlot = async (page: Page, chart: Locator) => {
  const plot = await chart.getByTestId(RUNNING_TOTAL_CHART.PLOT).boundingBox()
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
  await expect(activity.getByTestId(RUNNING_TOTAL_CHART.READOUT)).toHaveText(
    'Commits'
  )
  await expect(downloads.getByTestId(RUNNING_TOTAL_CHART.READOUT)).toHaveText(
    'npm downloads'
  )
  // Each chart ends at the count its glyph shows, shortened the same way.
  for (const chart of [activity, downloads]) {
    const total = await chart
      .getByTestId(RUNNING_TOTAL_CHART.TOTAL)
      .textContent()
    await expect(counts).toContainText(total ?? '')
  }

  // The tooltip stays open as the pointer crosses into it, and between charts.
  await hoverPlot(page, activity)
  await expect(activity.getByTestId(RUNNING_TOTAL_CHART.READOUT)).toHaveText(
    /^Through .+: [\d,]+ commits?$/
  )
  await hoverPlot(page, downloads)
  await expect(downloads.getByTestId(RUNNING_TOTAL_CHART.READOUT)).toHaveText(
    /^Through .+: [\d,]+ downloads?$/
  )
})

test("the wheel zooms both of a project's charts around the pointer, without scrolling the page", async ({
  page,
}) => {
  await page.goto('/')

  await getChartedCounts(page).hover()
  const tooltip = page.getByTestId(SELECTORS.TOOLTIP)
  const totals = tooltip.getByTestId(RUNNING_TOTAL_CHART.TOTAL)
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

test('a mouse drags a zoomed-in chart along its timeline', async ({ page }) => {
  await page.goto('/')

  await getChartedCounts(page).hover()
  const activity = page
    .getByTestId(SELECTORS.TOOLTIP)
    .getByTestId(COMMITS_CHART)
  const plot = activity.getByTestId(RUNNING_TOTAL_CHART.PLOT)
  const readout = activity.getByTestId(RUNNING_TOTAL_CHART.READOUT)
  await hoverPlot(page, activity)
  await page.mouse.wheel(0, -600)
  const box = await plot.boundingBox()
  if (!box) {
    throw new Error('The chart has no box')
  }
  /** Hovers just inside the plot's left edge and reads out the week there. */
  const readLeftEdge = async () => {
    await page.mouse.move(box.x + 8, box.y + box.height / 2)
    return readout.textContent()
  }

  const before = await readLeftEdge()
  // Dragged right, so it shows earlier weeks.
  await page.mouse.down()
  await page.mouse.move(box.x + 160, box.y + box.height / 2, { steps: 10 })
  await page.mouse.up()
  const after = await readLeftEdge()
  expect(
    Date.parse(after?.replace(/^Through (.+): .*$/, '$1') ?? '')
  ).toBeLessThan(Date.parse(before?.replace(/^Through (.+): .*$/, '$1') ?? ''))
})
