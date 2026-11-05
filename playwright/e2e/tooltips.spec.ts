import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { HEADER, PROJECTS, TOOLTIP } = SELECTORS

test.describe('Tooltips', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('the GitHub profile link says it is the profile', async ({ page }) => {
    await page.getByTestId(HEADER.GITHUB_LINK).hover()
    await expect(page.getByTestId(TOOLTIP)).toHaveText('GitHub Profile')
  })

  test.describe('Project card', () => {
    test('the name link shows where it goes', async ({ page }) => {
      const link = page.getByTestId(PROJECTS.NAME_LINK).first()
      const href = await link.getAttribute('href')
      await link.hover()
      await expect(page.getByTestId(TOOLTIP)).toHaveText(href ?? '')
    })

    test('the type icon names the project type', async ({ page }) => {
      const icon = page.getByTestId(PROJECTS.TYPE_ICON).first()
      const alt = await icon.getAttribute('alt')
      await icon.hover()
      await expect(page.getByTestId(TOOLTIP)).toHaveText(alt ?? '')
    })

    test('the repo link says it is the repository', async ({ page }) => {
      await page.getByTestId(PROJECTS.REPO_LINK).first().hover()
      await expect(page.getByTestId(TOOLTIP)).toHaveText('GitHub Repository')
    })
  })
})
