import { devices, expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { CARD, THUMBNAIL } = SELECTORS.PROJECTS

test('a live preview card shows its screenshot as a thumbnail', async ({
  page,
}) => {
  await page.goto('/')

  const thumbnail = page.getByTestId(CARD).first().getByTestId(THUMBNAIL)
  await thumbnail.scrollIntoViewIfNeeded()
  await expect(thumbnail).toBeVisible()
  // Fails if the screenshot didn't load, as a missing file or the CSP would.
  await expect
    .poll(() => thumbnail.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
})

test('on a phone, a live preview card shows its toggle without a thumbnail', async ({
  page,
}) => {
  // A phone's width, which is all the thumbnail's hiding turns on.
  await page.setViewportSize(devices['Pixel 7'].viewport)
  await page.goto('/')

  const card = page.getByTestId(CARD).first()
  await expect(card.getByTestId(SELECTORS.LIVE_PREVIEW.TOGGLE)).toBeVisible()
  await expect(card.getByTestId(THUMBNAIL)).toBeHidden()
})
