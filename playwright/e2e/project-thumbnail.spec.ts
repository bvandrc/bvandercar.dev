import { devices, expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { CARD, REPO_LINK, THUMBNAIL } = SELECTORS.PROJECTS

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

test("hovering a card's thumbnail draws its toggle as hovered", async ({
  page,
}) => {
  // The site's reduced motion drops the toggle's color transition, so each
  // color is read where it lands.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const card = page.getByTestId(CARD).first()
  const toggle = card.getByTestId(SELECTORS.LIVE_PREVIEW.TOGGLE)
  const getToggleColor = () =>
    toggle.evaluate((button) => getComputedStyle(button).color)
  const UNHOVERED_COLOR = await getToggleColor()
  await toggle.hover()
  const HOVERED_COLOR = await getToggleColor()
  expect(HOVERED_COLOR).not.toBe(UNHOVERED_COLOR)

  await card.getByTestId(THUMBNAIL).hover()
  // The thumbnail opens the preview too, so it shows as the toggle's hover.
  await expect.poll(getToggleColor).toBe(HOVERED_COLOR)
})

test("the keyboard reaches a card's toggle, and tabs on past its thumbnail", async ({
  page,
}) => {
  await page.goto('/')

  // A click on the thumbnail opens the preview, but the keyboard has the
  // toggle for that, as it does for a click on the rest of the card.
  const card = page.getByTestId(CARD).first()
  await card.getByTestId(REPO_LINK).focus()
  await page.keyboard.press('Tab')
  await expect(card.getByTestId(SELECTORS.LIVE_PREVIEW.TOGGLE)).toBeFocused()
  // The thumbnail follows the toggle in the page, so it would be next.
  await page.keyboard.press('Tab')
  await expect(card.getByTestId(THUMBNAIL)).not.toBeFocused()
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
