import type { Page } from '@playwright/test'

import { PACKAGE_DOWNLOADS } from '@/generated/package-downloads'
import { PROJECTS } from '@/generated/profile/content/projects'
import { REPO_ACTIVITY } from '@/generated/repo-activity'
import { SELECTORS } from '~/test-support/selectors'

const { REPO_LINK, COUNTS } = SELECTORS.PROJECTS

/**
 * The repo link of the first project whose counts, on hover, chart both its
 * activity and its npm downloads.
 *
 * Throws if none has enough of both, as when the build had no `GITHUB_TOKEN`
 * or couldn't reach npm. Only npm's downloads count, since CI's test builds
 * have no credentials for PyPI's.
 */
const getChartedRepoLink = (page: Page) => {
  const project = PROJECTS.flatMap(({ projects }) => projects).find(
    ({ repo, npmPackage }) =>
      (REPO_ACTIVITY[repo]?.commits.length ?? 0) > 1 &&
      npmPackage &&
      // Three weeks of downloads span the two weeks from the first publish a
      // chart needs, where two can fall short, for a package released days ago.
      (PACKAGE_DOWNLOADS.npm[npmPackage]?.weekly.length ?? 0) >= 3
  )
  if (!project) {
    throw new Error(
      'No project has more than a week of both activity and npm downloads'
    )
  }
  return page
    .getByTestId(REPO_LINK)
    .and(page.locator(`[href$="/${project.repo}"]`))
}

/** The counts in `getChartedRepoLink`'s link, whose hover charts them. */
export const getChartedCounts = (page: Page) =>
  getChartedRepoLink(page).getByTestId(COUNTS)
