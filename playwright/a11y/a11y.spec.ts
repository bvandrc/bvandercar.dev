import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { getChartedCounts } from '../support/charted-counts'
import { mockFramedPages } from '../support/mock-framed-pages'
import { checkA11y } from './accessibility'

const {
  HEADER,
  CONTENTS,
  PROJECTS,
  BEYOND_CODE,
  FOOTER,
  TOOLTIP,
  LIVE_PREVIEW,
} = SELECTORS

test.describe('Accessibility', () => {
  test('Home page', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId(HEADER.TITLE)).toBeVisible()
    await expect(page.getByTestId(PROJECTS.CARD).first()).toBeVisible()
    await expect(page.getByTestId(BEYOND_CODE)).toBeVisible()
    await expect(page.getByTestId(FOOTER.SELF)).toBeVisible()

    await checkA11y(page)
  })

  test('Contents bar', async ({ page }) => {
    await page.goto('/')

    // Jumps to a section, past the page's own contents, which brings the bar.
    await page.getByTestId(CONTENTS.LINK).first().click()
    await expect(page.getByTestId(CONTENTS.BAR.SELF)).toBeVisible()
    await expect(
      page.getByTestId(CONTENTS.BAR.SELF).locator('[aria-current]')
    ).toHaveCount(1)

    await checkA11y(page)
  })

  test('Open tooltip', async ({ page }) => {
    await page.goto('/')

    // Keyboard focus opens the counts' one too, which is how the mobile
    // project gets one.
    await page.getByTestId(PROJECTS.REPO_LINK).first().focus()
    await expect(page.getByTestId(TOOLTIP)).toBeVisible()

    // Radix portals the tooltip to the end of <body>, outside every landmark,
    // so it can float above the page; screen readers get its text as the
    // trigger's description instead.
    await checkA11y(page, { disableRules: ['region'] })
  })

  test('Open counts charts', async ({ page }) => {
    await page.goto('/')

    await getChartedCounts(page).hover()
    await expect(page.getByTestId(PROJECTS.ACTIVITY_CHART)).toBeVisible()
    await expect(page.getByTestId(PROJECTS.DOWNLOADS_CHART)).toBeVisible()

    // Portaled outside every landmark, like any tooltip.
    await checkA11y(page, { disableRules: ['region'] })
  })

  test('Open live preview', async ({ page }) => {
    await mockFramedPages(page)
    await page.goto('/')

    const preview = page.getByTestId(LIVE_PREVIEW.SELF).first()
    await preview.getByTestId(LIVE_PREVIEW.TOGGLE).click()
    await expect(preview.getByTestId(LIVE_PREVIEW.FRAME)).toBeVisible()

    await checkA11y(page)
  })
})
