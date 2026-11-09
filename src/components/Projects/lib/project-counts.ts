import { isNotNil } from 'es-toolkit'
import { objectEntries } from 'ts-extras'

import { PACKAGE_DOWNLOAD_TOTALS } from '@/generated/package-download-totals'
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
 * A project's counts as its glyphs show them, the package they're for, and
 * how many charts may show, one for each history this site fetched.
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
  return {
    // This site's own fetches are fresher than the profile's weekly counts,
    // and the charts are drawn from them, so a count they have wins, and each
    // chart ends at the count shown for it.
    counts: {
      ...REPO_COUNTS[repo],
      ...activityTotals,
      ...(downloadTotal !== undefined && { downloads: downloadTotal }),
    },
    pkg,
    // Only what this site fetched a history for can be charted.
    chartCount: [activityTotals, downloadTotal].filter(isNotNil).length,
  }
}
