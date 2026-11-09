import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { HEADER, PROJECTS, SKILLS, BEYOND_CODE, FOOTER } = SELECTORS

test('home page loads', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Blake Vandercar')
  for (const testId of [
    HEADER.TITLE,
    PROJECTS.SELF,
    SKILLS.SELF,
    BEYOND_CODE,
    FOOTER.SELF,
  ]) {
    await expect(page.getByTestId(testId), testId).toBeVisible()
  }
})
