import { expect, type Page, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { CONTENTS } = SELECTORS
const { BAR } = CONTENTS

const scrollToTop = (page: Page) =>
  page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))

/** Scrolls the page's own contents just out of view off the top. */
const scrollPastContents = (page: Page) =>
  page.getByTestId(CONTENTS.SELF).evaluate((contents) =>
    window.scrollTo({
      top: contents.getBoundingClientRect().bottom + window.scrollY + 1,
      behavior: 'instant',
    })
  )

test('each contents link scrolls its section into view', async ({ page }) => {
  await page.goto('/')
  const links = page.getByTestId(CONTENTS.LINK)
  // A link per project group, and one for the skills.
  expect(await links.count()).toBeGreaterThan(1)

  for (const link of await links.all()) {
    const href = await link.getAttribute('href')
    await link.click()
    await expect(page.locator(`section${href}`), href ?? '').toBeInViewport()
    await scrollToTop(page)
  }
})

test.describe('Contents bar', () => {
  // Jumps rather than glides, so a section has landed once its link is current.
  test.use({ reducedMotion: 'reduce' })

  test('shows only once the contents have scrolled off the top', async ({
    page,
  }) => {
    await page.goto('/')
    const bar = page.getByTestId(BAR.SELF)
    await expect(bar).toBeHidden()

    await scrollPastContents(page)
    await expect(bar).toBeVisible()

    await scrollToTop(page)
    await expect(bar).toBeHidden()
  })

  test('each link lands its section below the bar, and lights up', async ({
    page,
  }) => {
    await page.goto('/')
    await scrollPastContents(page)
    const bar = page.getByTestId(BAR.SELF)
    await expect(bar).toBeVisible()
    const barBox = await bar.boundingBox()
    const barBottom = (barBox?.y ?? 0) + (barBox?.height ?? 0)
    const links = bar.getByTestId(BAR.LINK)
    // As many as the page's own contents.
    await expect(links).toHaveCount(
      await page.getByTestId(CONTENTS.LINK).count()
    )

    for (const link of await links.all()) {
      const href = (await link.getAttribute('href')) ?? ''
      await link.click()
      await expect(link, href).toHaveAttribute('aria-current', 'location')
      // The one link lit up.
      await expect(bar.locator('[aria-current]'), href).toHaveCount(1)
      const sectionBox = await page.locator(`section${href}`).boundingBox()
      expect(sectionBox?.y, href).toBeGreaterThanOrEqual(barBottom)
    }
  })

  test('its logo goes back to the top', async ({ page }) => {
    await page.goto('/')
    await scrollPastContents(page)

    await page.getByTestId(BAR.TOP_LINK).click()
    await expect(page.getByTestId(CONTENTS.SELF)).toBeInViewport()
    await expect(page.getByTestId(BAR.SELF)).toBeHidden()
  })
})
