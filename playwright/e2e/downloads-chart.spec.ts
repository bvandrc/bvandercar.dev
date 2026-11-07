import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { getChartedCounts } from '../support/charted-counts'

const { DOWNLOADS_CHART } = SELECTORS.PROJECTS

test("hovering an npm project's counts charts its weekly downloads, read out week by week", async ({
  page,
}) => {
  await page.goto('/')

  await getChartedCounts(page).hover()
  const tooltip = page.getByTestId(SELECTORS.TOOLTIP)
  await expect(tooltip.getByTestId(DOWNLOADS_CHART.SELF)).toBeVisible()
  const readout = tooltip.getByTestId(DOWNLOADS_CHART.READOUT)
  await expect(readout).toHaveText(/^Weekly npm downloads, peak/)

  // The tooltip stays open as the pointer crosses into it.
  const plot = await tooltip.getByTestId(DOWNLOADS_CHART.PLOT).boundingBox()
  if (!plot) {
    throw new Error('The chart has no box')
  }
  await page.mouse.move(plot.x + plot.width / 2, plot.y + plot.height / 2, {
    steps: 10,
  })
  await expect(readout).toHaveText(/^Week of .+: [\d,]+ downloads?$/)
})
