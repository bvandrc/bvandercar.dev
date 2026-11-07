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

test("hovering a project's counts charts its activity and npm downloads, read out week by week", async ({
  page,
}) => {
  await page.goto('/')

  await getChartedCounts(page).hover()
  const tooltip = page.getByTestId(SELECTORS.TOOLTIP)
  const activity = tooltip.getByTestId(ACTIVITY_CHART)
  const downloads = tooltip.getByTestId(DOWNLOADS_CHART)
  await expect(activity.getByTestId(WEEKLY_CHART.READOUT)).toHaveText(
    'WeeklycommitsPRs'
  )
  await expect(downloads.getByTestId(WEEKLY_CHART.READOUT)).toHaveText(
    /^Weekly npm downloads, peak/
  )

  // The tooltip stays open as the pointer crosses into it, and between charts.
  await hoverPlot(page, activity)
  await expect(activity.getByTestId(WEEKLY_CHART.READOUT)).toHaveText(
    /^Week of .+: [\d,]+ commits?, [\d,]+ PRs?$/
  )
  await hoverPlot(page, downloads)
  await expect(downloads.getByTestId(WEEKLY_CHART.READOUT)).toHaveText(
    /^Week of .+: [\d,]+ downloads?$/
  )
})
