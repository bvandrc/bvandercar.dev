import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { getChartedCounts } from '../support/charted-counts'

const { COMMITS_CHART } = SELECTORS.PROJECTS

test.use({ hasTouch: true })

test('on a touch screen, spreading two fingers on a chart zooms it, not the page', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await getChartedCounts(page).tap()
  const tooltip = page.getByTestId(SELECTORS.TOOLTIP)
  const totals = tooltip.getByTestId(
    SELECTORS.PROJECTS.RUNNING_TOTAL_CHART.TOTAL
  )
  await expect(totals).toHaveCount(2)
  const box = await tooltip
    .getByTestId(COMMITS_CHART)
    .getByTestId(SELECTORS.PROJECTS.RUNNING_TOTAL_CHART.PLOT)
    .boundingBox()
  if (!box) {
    throw new Error('The chart has no box')
  }

  // Playwright has no pinch of its own, so the fingers go through Chromium's
  // DevTools protocol.
  const cdp = await context.newCDPSession(page)
  const [middle, y] = [box.x + box.width / 2, box.y + box.height / 2]
  /** Sends two fingers `spread` px either side of the plot's middle. */
  const touch = (
    type: 'touchStart' | 'touchMove' | 'touchEnd',
    spread: number
  ) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints:
        type === 'touchEnd'
          ? []
          : [
              { x: middle - spread, y, id: 1 },
              { x: middle + spread, y, id: 2 },
            ],
    })
  await touch('touchStart', 20)
  for (let spread = 30; spread <= 120; spread += 10) {
    await touch('touchMove', spread)
  }
  await touch('touchEnd', 0)

  // Zoomed in around the middle, short of the lines' ends and their totals.
  await expect(totals).toHaveCount(0)
  expect(await page.evaluate(() => window.visualViewport?.scale)).toBe(1)
})
