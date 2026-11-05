import { expect } from '@playwright/test'
import { desktopConfig } from 'lighthouse'

import { SELECTORS } from '~/test-support/selectors'
import { lighthouseTest as test } from './fixtures'

const { HEADER } = SELECTORS

test('Home page', async ({ page, runAudit }) => {
  await page.goto('/')
  await expect(page.getByTestId(HEADER.TITLE)).toBeVisible()

  await runAudit({
    name: 'home-desktop',
    lighthouseArgs: { config: desktopConfig },
  })
  await runAudit({ name: 'home-mobile' })
})
