import type { Page } from '@playwright/test'

import { getProjectCharts } from '@/components/Projects/charts/lib/project-charts'
import { PROJECTS } from '@/generated/profile/content/projects'
import { SELECTORS } from '~/test-support/selectors'

const { CARD, REPO_LINK, COUNTS } = SELECTORS.PROJECTS

/**
 * The card of the first project whose counts, on hover, chart both its
 * activity and its npm downloads.
 *
 * Throws if none does, as when the build had no `GITHUB_TOKEN` or couldn't
 * reach npm. Only npm's downloads count, since CI's test builds have no
 * credentials for PyPI's.
 */
export const getChartedCard = (page: Page) => {
  const project = PROJECTS.flatMap(({ projects }) => projects).find(
    ({ repo, npmPackage }) => {
      if (!npmPackage) {
        return false
      }
      const charts = getProjectCharts(repo, {
        registry: 'npm',
        name: npmPackage,
      })
      return Boolean(charts?.activity && charts.downloads)
    }
  )
  if (!project) {
    throw new Error('No project charts both its activity and its npm downloads')
  }
  return page.getByTestId(CARD).filter({
    has: page
      .getByTestId(REPO_LINK)
      .and(page.locator(`[href$="/${project.repo}"]`)),
  })
}

/** The counts on `getChartedCard`'s card, whose hover charts them. */
export const getChartedCounts = (page: Page) =>
  getChartedCard(page).getByTestId(COUNTS)
