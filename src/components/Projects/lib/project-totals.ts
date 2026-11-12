import { isNotNil, sumBy, uniqBy } from 'es-toolkit'

import { ACCOUNT_ACTIVITY_TOTALS } from '@/generated/account-activity-totals'
import { COUNT_KINDS, type CountKey } from '@/generated/profile/content/counts'
import { PROJECTS } from '@/generated/profile/content/projects'
import { getProjectCounts } from './project-counts'

/**
 * Every project's counts added up, in the order the glyphs show them, the
 * repos and packages to chart them from, and how many charts may show.
 *
 * Commits and PRs are the GitHub account's own, in every repo, its forks and
 * others' included, where the build fetched them; otherwise, as downloads
 * always are, they're the projects' own, those each one's glyphs show, PRs
 * included where they don't. A kind of count is only charted where this site
 * fetched it for every project that has it, or the account's, so each chart
 * ends at the total it's shown with; otherwise its repos or packages are
 * empty.
 */
export const getProjectTotals = () => {
  // A repo shows once, whichever groups it's in.
  const projects = uniqBy(
    PROJECTS.flatMap((group) => group.projects),
    ({ repo }) => repo
  ).map((project) => ({ repo: project.repo, ...getProjectCounts(project) }))
  const activityFetched = projects.every(({ fetched }) => fetched.activity)
  const downloadsFetched = projects.every(
    ({ counts, fetched }) => counts.downloads === undefined || fetched.downloads
  )
  const accountFetched = ACCOUNT_ACTIVITY_TOTALS !== undefined
  /** The total of `key`'s count: the account's, where fetched, or else every project's that has one added up. */
  const getTotal = (key: CountKey) => {
    if (key !== 'downloads' && ACCOUNT_ACTIVITY_TOTALS) {
      return ACCOUNT_ACTIVITY_TOTALS[key]
    }
    const counted = projects.filter(({ counts }) => counts[key] !== undefined)
    return counted.length === 0
      ? undefined
      : sumBy(counted, ({ counts }) => counts[key] ?? 0)
  }
  const shown = COUNT_KINDS.flatMap(({ key, icon, noun }) => {
    const count = getTotal(key)
    return count === undefined ? [] : [{ key, icon, noun, count }]
  })
  const hasDownloads = shown.some(({ key }) => key === 'downloads')
  return {
    shown,
    repos: activityFetched ? projects.map(({ repo }) => repo) : [],
    packages:
      downloadsFetched && hasDownloads
        ? projects.map(({ pkg }) => pkg).filter(isNotNil)
        : [],
    // Commits and PRs from the account, or the repos, and downloads from the
    // packages.
    chartCount:
      (accountFetched || activityFetched ? 2 : 0) +
      (downloadsFetched && hasDownloads ? 1 : 0),
  }
}
