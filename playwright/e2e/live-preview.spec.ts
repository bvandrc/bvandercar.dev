import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import {
  MOCK_FRAMED_PAGE_TEXT,
  mockFramedPages,
} from '../support/mock-framed-pages'

const { LIVE_PREVIEW } = SELECTORS

test('a project live preview loads its site once opened', async ({ page }) => {
  await mockFramedPages(page)
  await page.goto('/')

  const preview = page.getByTestId(LIVE_PREVIEW.SELF).first()
  await expect(preview.getByTestId(LIVE_PREVIEW.FRAME)).toHaveCount(0)

  await preview.getByTestId(LIVE_PREVIEW.TOGGLE).click()
  // Fails if the CSP's frame-src blocks the site.
  await expect(
    preview
      .frameLocator(`[data-testid="${LIVE_PREVIEW.FRAME}"]`)
      .getByText(MOCK_FRAMED_PAGE_TEXT)
  ).toBeVisible()
})

test('the preview toggles pulse on each visit until one is opened', async ({
  page,
}) => {
  await mockFramedPages(page)
  await page.goto('/')

  const toggles = page.getByTestId(LIVE_PREVIEW.TOGGLE)
  await expect(toggles.first()).toHaveAttribute('data-pulse', 'true')
  await expect(toggles.last()).toHaveAttribute('data-pulse', 'true')

  // Opening any one stops them all, the others included.
  await toggles.first().click()
  await expect(toggles.first()).toHaveAttribute('data-pulse', 'false')
  await expect(toggles.last()).toHaveAttribute('data-pulse', 'false')

  // A new visit starts the pulse again.
  await page.reload()
  await expect(toggles.first()).toHaveAttribute('data-pulse', 'true')
})
