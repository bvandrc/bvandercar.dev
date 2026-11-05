import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { HEADER, MAIN, PROJECTS, SKILLS, BEYOND_CODE, FOOTER } = SELECTORS

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
  await expect(page.getByTestId(HEADER.TAGLINE)).not.toBeEmpty()
  await expect(page.getByTestId(MAIN)).toBeVisible()
  await expect(page.getByTestId(FOOTER.GITHUB_LINK)).toHaveAttribute(
    'href',
    'https://github.com/bvandrc'
  )
})

// The content comes from bvandrc/bvandrc at build time, so these check that it
// arrived and rendered rather than pinning any particular project or skill.
test('profile content renders', async ({ page }) => {
  await page.goto('/')
  const { CARD } = PROJECTS

  await expect(page.getByTestId(CARD.SELF).first()).toBeVisible()
  await expect(page.getByTestId(CARD.NAME).first()).toHaveAttribute(
    'href',
    /^https:\/\//
  )
  // Each type icon names its type for screen readers. Its image comes from a
  // third-party CDN, so loading it is left out of the test.
  await expect(page.getByTestId(CARD.TYPE_ICON)).toHaveCount(
    await page.getByTestId(CARD.SELF).count()
  )
  await expect(page.getByTestId(CARD.TYPE_ICON).first()).toHaveAttribute(
    'alt',
    /\S/
  )
  await expect(page.getByTestId(CARD.REPO_LINK).first()).toHaveAttribute(
    'href',
    /^https:\/\/github\.com\/bvandrc\//
  )
  // Screenshots are fetched into public/ at build time, so check they load.
  const screenshot = page.getByTestId(CARD.SCREENSHOT).first()
  await screenshot.scrollIntoViewIfNeeded()
  await expect
    .poll(() =>
      screenshot.evaluate((img: HTMLImageElement) => img.naturalWidth)
    )
    .toBeGreaterThan(0)

  await expect(page.getByTestId(SKILLS.CHIP).first()).toBeVisible()
  await expect(page.getByTestId(BEYOND_CODE)).toBeVisible()
})
