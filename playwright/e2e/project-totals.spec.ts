import { expect, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'

const { TOTALS } = SELECTORS.PROJECTS

test("the footer adds up every project's counts, linking up to the projects", async ({
  page,
}) => {
  await page.goto('/')

  const counts = page
    .getByTestId(SELECTORS.FOOTER.SELF)
    .getByTestId(TOTALS.COUNTS)
  await expect(counts).toHaveAttribute(
    'aria-label',
    /^[\d,]+ commits, [\d,]+ PRs, [\d,]+ downloads$/
  )

  // Hovering shows them, charted or in words, as the build fetched them.
  await counts.hover()
  await expect(page.getByTestId(SELECTORS.TOOLTIP)).toBeVisible()

  await page.getByTestId(TOTALS.LINK).click()
  await expect(page).toHaveURL(/#projects$/)
  await expect(page.getByTestId(SELECTORS.PROJECTS.SELF)).toBeInViewport()
})
