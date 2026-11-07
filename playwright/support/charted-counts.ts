import type { Page } from '@playwright/test'

import { NPM_DOWNLOADS } from '@/generated/npm-downloads'
import { PROJECTS } from '@/generated/profile/content/projects'
import { SELECTORS } from '~/test-support/selectors'

const { REPO_LINK, COUNTS } = SELECTORS.PROJECTS

/**
 * The counts of the first project whose npm downloads chart on hover.
 *
 * Throws if none has more than a week of them, as when `pnpm fetch:downloads`
 * couldn't reach npm.
 */
export const getChartedCounts = (page: Page) => {
  const project = PROJECTS.flatMap(({ projects }) => projects).find(
    ({ npmPackage }) =>
      npmPackage && (NPM_DOWNLOADS[npmPackage]?.weekly.length ?? 0) > 1
  )
  if (!project) {
    throw new Error('No npm package has more than a week of downloads')
  }
  return page
    .getByTestId(REPO_LINK)
    .and(page.locator(`[href$="/${project.repo}"]`))
    .getByTestId(COUNTS)
}
