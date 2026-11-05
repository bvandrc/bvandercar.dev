import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { checkA11y } from './accessibility'

const { HEADER, FEATURE_LIST } = SELECTORS

test.describe('Accessibility', () => {
  test('Home page', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId(HEADER.TITLE)).toBeVisible()
    await expect(page.getByTestId(FEATURE_LIST.CARD.SELF).first()).toBeVisible()

    await checkA11y(page)
  })
})
