import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { getChartedCounts, getChartedRepoLink } from '../support/charted-counts'

const { REPO_LINK_LABEL, ACTIVITY_CHART } = SELECTORS.PROJECTS

test.use({ hasTouch: true })

test('on a touch screen, tapping the counts toggles their charts, and tapping "repo" opens the repo', async ({
  page,
  context,
}) => {
  // Stands in for GitHub, so the suite never loads it.
  await context.route('https://github.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>Repo</title>' })
  )
  await page.goto('/')
  const counts = getChartedCounts(page)
  const chart = page.getByTestId(ACTIVITY_CHART)

  await counts.tap()
  await expect(chart).toBeVisible()
  await counts.tap()
  await expect(chart).toBeHidden()
  // Neither tap followed the link.
  expect(context.pages()).toHaveLength(1)

  const repoLink = getChartedRepoLink(page)
  const [repoPage] = await Promise.all([
    context.waitForEvent('page'),
    repoLink.getByTestId(REPO_LINK_LABEL).tap(),
  ])
  expect(repoPage.url()).toBe(await repoLink.getAttribute('href'))
})
