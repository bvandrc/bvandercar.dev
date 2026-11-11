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

  test('Expanded intro', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The intro only collapses below sm')
    await page.goto('/')

    await page.getByTestId(HEADER.INTRO_TOGGLE).click()
    await expect(page.getByTestId(HEADER.INTRO_MORE)).toBeVisible()

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

  test('Open contents bar menu', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId(CONTENTS.LINK).first().click()
    await page.getByTestId(CONTENTS.BAR.MENU_TOGGLE).click()
    await expect(page.getByTestId(CONTENTS.BAR.MENU.SELF)).toBeVisible()

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
    await expect(page.getByTestId(PROJECTS.COMMITS_CHART)).toBeVisible()
    await expect(page.getByTestId(PROJECTS.DOWNLOADS_CHART)).toBeVisible()

    // Portaled outside every landmark, like any tooltip.
    await checkA11y(page, { disableRules: ['region'] })
  })

  test('Open project totals', async ({ page }) => {
    await page.goto('/')

    // Charted where the build fetched every project's counts, in words where
    // it couldn't, as in CI's test builds.
    const link = page.getByTestId(PROJECTS.TOTALS.LINK)
    // In view first: on a phone, the contents bar's own scroll ends before
    // the page's, which opens the tooltip early, and the page's then closes it.
    await link.scrollIntoViewIfNeeded()
    await link.focus()
    await expect(page.getByTestId(TOOLTIP)).toBeVisible()
    await expect(page.getByTestId(PROJECTS.CHARTS_LOADING)).toHaveCount(0)

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
