import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { REPO_LINK, REPO_LINK_LABEL, COUNTS } = SELECTORS.PROJECTS

test.use({ hasTouch: true })

test('on a touch screen, tapping the counts toggles their tooltip, and tapping "repo" opens the repo', async ({
  page,
  context,
}) => {
  // Stands in for GitHub, so the suite never loads it.
  await context.route('https://github.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>Repo</title>' })
  )
  await page.goto('/')
  const repoLink = page.getByTestId(REPO_LINK).first()
  const counts = repoLink.getByTestId(COUNTS)
  const tooltip = page.getByTestId(SELECTORS.TOOLTIP)

  await counts.tap()
  await expect(tooltip).toBeVisible()
  await counts.tap()
  await expect(tooltip).toBeHidden()
  // Neither tap followed the link.
  expect(context.pages()).toHaveLength(1)

  const [repoPage] = await Promise.all([
    context.waitForEvent('page'),
    repoLink.getByTestId(REPO_LINK_LABEL).tap(),
  ])
  expect(repoPage.url()).toBe(await repoLink.getAttribute('href'))
})
