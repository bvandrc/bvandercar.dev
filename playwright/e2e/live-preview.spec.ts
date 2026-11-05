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
