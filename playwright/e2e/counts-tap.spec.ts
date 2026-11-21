import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { getChartedCounts } from '../support/charted-counts'

test.use({ hasTouch: true })

test("on a touch screen, tapping a project's counts only opens and closes their charts, and leaves the page where it is", async ({
  page,
}) => {
  await page.goto('/')
  const counts = getChartedCounts(page)
  const url = page.url()

  await counts.tap()
  await expect(
    page
      .getByTestId(SELECTORS.TOOLTIP)
      .getByTestId(SELECTORS.PROJECTS.COMMITS_CHART)
  ).toBeVisible()
  await counts.tap()
  await expect(counts).toHaveAttribute('data-state', 'closed')
  expect(page.url()).toBe(url)
  expect(page.context().pages()).toHaveLength(1)
})
