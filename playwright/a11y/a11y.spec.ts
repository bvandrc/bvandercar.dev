import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { checkA11y } from './accessibility'

const { HEADER, PROJECTS, FOOTER } = SELECTORS

test.describe('Accessibility', () => {
  test('Home page', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId(HEADER.TITLE)).toBeVisible()
    await expect(page.getByTestId(PROJECTS.CARD).first()).toBeVisible()
    await expect(page.getByTestId(FOOTER.SELF)).toBeVisible()

    await checkA11y(page)
  })
})
