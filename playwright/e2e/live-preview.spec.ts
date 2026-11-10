import { devices, expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import {
  MOCK_FRAMED_PAGE_TEXT,
  mockFramedPages,
} from '../support/mock-framed-pages'

const { CONTENTS, LIVE_PREVIEW } = SELECTORS

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

test('on a phone, opening a live preview scrolls its toggle and frame on screen, below the contents bar', async ({
  page,
}) => {
  const PHONE_VIEWPORT = devices['iPhone 13'].viewport
  await page.setViewportSize(PHONE_VIEWPORT)
  await mockFramedPages(page)
  await page.goto('/')

  const preview = page.getByTestId(LIVE_PREVIEW.SELF).first()
  const toggle = preview.getByTestId(LIVE_PREVIEW.TOGGLE)
  await toggle.click()

  const frame = preview.getByTestId(LIVE_PREVIEW.FRAME)
  const bar = page.getByTestId(CONTENTS.BAR.SELF)
  // Once the scroll settles.
  await expect
    .poll(async () => {
      const [toggleBox, frameBox, barBox] = await Promise.all([
        toggle.boundingBox(),
        frame.boundingBox(),
        bar.boundingBox(),
      ])
      if (!(toggleBox && frameBox && barBox)) {
        return undefined
      }
      return {
        toggleBelowBar: toggleBox.y >= barBox.y + barBox.height,
        frameOnScreen: frameBox.y + frameBox.height <= PHONE_VIEWPORT.height,
      }
    })
    .toEqual({ toggleBelowBar: true, frameOnScreen: true })
})
