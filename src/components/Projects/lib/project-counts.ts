import { isNotNil } from 'es-toolkit'
import { objectEntries } from 'ts-extras'

import { PACKAGE_DOWNLOAD_TOTALS } from '@/generated/package-download-totals'
import { getShownCountKinds } from '@/generated/profile/content/counts'
import type { Project } from '@/generated/profile/content/projects'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { REPO_ACTIVITY_TOTALS } from '@/generated/repo-activity-totals'
import { type CountsField, PACKAGE_FIELDS } from '~/counts'
import type { ProjectPackage } from '../charts/lib/project-charts'

/** The registry the project publishes a package to, and its name there, if any. */
const getPackage = (
  packages: Omit<Pick<Project, CountsField>, 'repo'>
): ProjectPackage | undefined => {
  for (const [registry, field] of objectEntries(PACKAGE_FIELDS)) {
    const name = packages[field]
    if (name) {
      return { registry, name }
    }
  }
  return undefined
}

/**
 * A project's counts, those its glyphs show, in their order and with their
 * icons, the package they're for, and how many charts may show, one for each
 * history this site fetched.
 *
 * A count this site fetched wins over the profile's, which is older.
 */
export const getProjectCounts = ({
  repo,
  ...packages
}: Pick<Project, CountsField>) => {
  const activityTotals = REPO_ACTIVITY_TOTALS[repo]
  const pkg = getPackage(packages)
  const downloadTotal = pkg && PACKAGE_DOWNLOAD_TOTALS[pkg.registry][pkg.name]
  // This site's own fetches are fresher than the profile's weekly counts, and
  // the charts are drawn from them, so a count they have wins, and each chart
  // ends at the count shown for it.
  const counts = {
    ...REPO_COUNTS[repo],
    ...activityTotals,
    ...(downloadTotal !== undefined && { downloads: downloadTotal }),
  }
  return {
    counts,
    // The profile README badge's counts, in its order and with its icons, and
    // its PRs only where its rule shows them.
    shown: getShownCountKinds(counts).flatMap(({ key, icon, noun }) => {
      const count = counts[key]
      return count === undefined ? [] : [{ key, icon, noun, count }]
    }),
    pkg,
    // Only what this site fetched a history for can be charted.
    chartCount: [activityTotals, downloadTotal].filter(isNotNil).length,
  }
}

export type ProjectCounts = ReturnType<typeof getProjectCounts>
