import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { INTRO_MORE, INTRO_TOGGLE } = SELECTORS.HEADER

test.describe('Header intro, below sm', () => {
  // A Pixel 7's width.
  test.use({ viewport: { width: 412, height: 915 } })

  test('shows its first lines, and the rest once "More about me" is tapped', async ({
    page,
  }) => {
    await page.goto('/')
    const more = page.getByTestId(INTRO_MORE)
    const toggle = page.getByTestId(INTRO_TOGGLE)

    await expect(more).toBeHidden()
    await expect(toggle).toHaveText('More about me')

    await toggle.click()
    await expect(more).toBeVisible()
    await expect(toggle).toHaveText('Less')

    await toggle.click()
    await expect(more).toBeHidden()
  })
})

test.describe('Header intro, from sm up', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('shows every line, with no toggle', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId(INTRO_MORE)).toBeVisible()
    await expect(page.getByTestId(INTRO_TOGGLE)).toHaveCount(0)
  })
})
