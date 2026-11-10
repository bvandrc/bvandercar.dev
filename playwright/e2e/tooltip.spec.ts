import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { NAME_LINK } = SELECTORS.PROJECTS
const { TOOLTIP } = SELECTORS

// Past the tooltips' 150ms open delay, so one that was opening has.
const TOOLTIP_SETTLE_MS = 500

test('keyboard focus on a link below the fold keeps its tooltip open as the page scrolls to it', async ({
  page,
}) => {
  await page.goto('/')
  const link = page.getByTestId(NAME_LINK).last()
  await expect(link).not.toBeInViewport()

  await link.focus()
  await page.waitForTimeout(TOOLTIP_SETTLE_MS)
  await expect(page.getByTestId(TOOLTIP)).toHaveText(
    (await link.getAttribute('href')) ?? ''
  )
})
