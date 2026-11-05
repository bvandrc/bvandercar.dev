import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { HEADER, MAIN, FOOTER } = SELECTORS

test('home page loads', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Blake Vandercar')
  await expect(page.getByTestId(HEADER.TITLE)).toHaveText('Blake Vandercar')
  // Checks the image loaded, not just its box: a wrong asset path still
  // renders the box.
  await expect
    .poll(() =>
      page
        .getByTestId(HEADER.LOGO)
        .evaluate((img: HTMLImageElement) => img.naturalWidth)
    )
    .toBeGreaterThan(0)
  await expect(page.getByTestId(HEADER.STATUS)).toHaveText('Under construction')
  await expect(page.getByTestId(MAIN)).toBeVisible()
  await expect(page.getByTestId(FOOTER.GITHUB_LINK)).toHaveAttribute(
    'href',
    'https://github.com/bvandrc'
  )
})
