import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { getChartedRepoLink } from '../support/charted-counts'

const { COUNTS, ACTIVITY_CHART } = SELECTORS.PROJECTS
const { TOOLTIP } = SELECTORS

// Past the tooltips' 150ms open delay, so one that was opening has.
const TOOLTIP_SETTLE_MS = 500

test("a click on a repo link opens no tooltip, where keyboard focus opens the counts' charts", async ({
  page,
}) => {
  await page.goto('/')
  const link = getChartedRepoLink(page)
  // Keeps the click from opening the repo in a new tab.
  await link.evaluate((element) =>
    element.addEventListener('click', (event) => event.preventDefault())
  )
  // In the gap between the counts and "repo", hovering neither, whose own
  // tooltips would open on hover, and opening one closes the other.
  const linkBox = await link.boundingBox()
  const countsBox = await link.getByTestId(COUNTS).boundingBox()
  if (!linkBox || !countsBox) {
    throw new Error('The repo link is not laid out')
  }
  await link.click({
    position: {
      x: countsBox.x + countsBox.width + 6 - linkBox.x,
      y: linkBox.height / 2,
    },
  })
  await expect(link).toBeFocused()
  await page.waitForTimeout(TOOLTIP_SETTLE_MS)
  await expect(page.getByTestId(TOOLTIP)).toHaveCount(0)

  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(link).toBeFocused()
  await expect(page.getByTestId(ACTIVITY_CHART)).toBeVisible()
})

test("keyboard focus on a repo link below the fold keeps its counts' charts open as the page scrolls to it", async ({
  page,
}) => {
  await page.goto('/')
  const link = getChartedRepoLink(page)
  await expect(link).not.toBeInViewport()

  await link.focus()
  await page.waitForTimeout(TOOLTIP_SETTLE_MS)
  await expect(page.getByTestId(ACTIVITY_CHART)).toBeVisible()
})
