import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { CONTENTS } = SELECTORS

test('each contents link scrolls its section into view', async ({ page }) => {
  await page.goto('/')
  const links = page.getByTestId(CONTENTS.LINK)
  // A link per project group, and one for the skills.
  expect(await links.count()).toBeGreaterThan(1)

  for (const link of await links.all()) {
    const href = await link.getAttribute('href')
    await link.click()
    await expect(page.locator(`section${href}`), href ?? '').toBeInViewport()
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  }
})
