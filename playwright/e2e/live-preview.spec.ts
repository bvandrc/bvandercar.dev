import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import {
  MOCK_FRAMED_PAGE_TEXT,
  mockFramedPages,
} from '../support/mock-framed-pages'

const { LIVE_PREVIEW, PROJECTS } = SELECTORS

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

test('a click on a project card toggles its live preview', async ({ page }) => {
  await mockFramedPages(page)
  await page.goto('/')

  const card = page
    .getByTestId(PROJECTS.CARD)
    .filter({ has: page.getByTestId(LIVE_PREVIEW.SELF) })
    .first()
  const frame = card.getByTestId(LIVE_PREVIEW.FRAME)
  // The card's corner, clear of its links and toggle.
  const corner = { position: { x: 4, y: 4 } }

  await card.click(corner)
  await expect(frame).toBeVisible()

  await card.click(corner)
  await expect(frame).toHaveCount(0)
})
