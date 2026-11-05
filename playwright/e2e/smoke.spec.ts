import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { HEADER, PROJECTS, SKILLS, BEYOND_CODE } = SELECTORS

test('home page loads', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Blake Vandercar')
  for (const testId of [
    HEADER.TITLE,
    HEADER.GITHUB_LINK,
    PROJECTS.SELF,
    SKILLS.SELF,
    BEYOND_CODE,
  ]) {
    await expect(page.getByTestId(testId), testId).toBeVisible()
  }
})
