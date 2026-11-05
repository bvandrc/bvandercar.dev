import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { HEADER, FEATURE_LIST, FOOTER } = SELECTORS

test('home page loads', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('React Frontend Template')
  await expect(page.getByTestId(HEADER.TITLE)).toHaveText(
    'React Frontend Template'
  )
  // Checks the image loaded, not just its box: a wrong asset path (like a
  // leading-slash `/logo.svg` under the Pages subpath) still renders the box.
  await expect
    .poll(() =>
      page
        .getByTestId(HEADER.LOGO)
        .evaluate((img: HTMLImageElement) => img.naturalWidth)
    )
    .toBeGreaterThan(0)
  await expect(page.getByTestId(FEATURE_LIST.CARD.SELF)).toHaveCount(8)
  await expect(page.getByTestId(FOOTER)).toBeVisible()
})
