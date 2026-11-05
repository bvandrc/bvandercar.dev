import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { checkA11y } from './accessibility'

const { HEADER, PROJECTS, BEYOND_CODE, TOOLTIP } = SELECTORS

test.describe('Accessibility', () => {
  test('Home page', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId(HEADER.TITLE)).toBeVisible()
    await expect(page.getByTestId(PROJECTS.CARD).first()).toBeVisible()
    await expect(page.getByTestId(BEYOND_CODE)).toBeVisible()

    await checkA11y(page)
  })

  test('Open tooltip', async ({ page }) => {
    await page.goto('/')

    // Keyboard focus opens it too, which is how the mobile project gets one.
    await page.getByTestId(PROJECTS.REPO_LINK).first().focus()
    await expect(page.getByTestId(TOOLTIP)).toBeVisible()

    // Radix portals the tooltip to the end of <body>, outside every landmark,
    // so it can float above the page; screen readers get its text as the
    // trigger's description instead.
    await checkA11y(page, { disableRules: ['region'] })
  })
})
