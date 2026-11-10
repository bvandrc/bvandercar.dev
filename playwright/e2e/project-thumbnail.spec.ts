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
  // Beside the toggle, there's no screenshot across it.
  await expect(
    page.getByTestId(CARD).first().getByTestId(SELECTORS.LIVE_PREVIEW.POSTER)
  ).toBeHidden()
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
  // A busy browser can apply a hover a frame or so after the pointer
  // arrives, so each color is waited for rather than read once.
  await toggle.hover()
  await expect.poll(getToggleColor).not.toBe(UNHOVERED_COLOR)
  const HOVERED_COLOR = await getToggleColor()

  // Off the toggle first, so its own hover can't linger into the check below.
  await page.mouse.move(0, 0)
  await expect.poll(getToggleColor).toBe(UNHOVERED_COLOR)

  await card.getByTestId(THUMBNAIL).hover()
  // The thumbnail opens the preview too, so it shows as the toggle's hover.
  await expect.poll(getToggleColor).toBe(HOVERED_COLOR)
})

test('on a phone, a live preview card shows its screenshot across its toggle, not beside it', async ({
  page,
}) => {
  // A phone's width, which is all that moves the screenshot.
  await page.setViewportSize(devices['Pixel 7'].viewport)
  await page.goto('/')

  const card = page.getByTestId(CARD).first()
  const poster = card.getByTestId(SELECTORS.LIVE_PREVIEW.POSTER)
  await poster.scrollIntoViewIfNeeded()
  await expect(poster).toBeVisible()
  // Fails if the screenshot didn't load, as a missing file or the CSP would.
  await expect
    .poll(() => poster.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
  await expect(card.getByTestId(THUMBNAIL)).toBeHidden()
})
