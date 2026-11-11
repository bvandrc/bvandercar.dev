import { isNotNil, sumBy, uniqBy } from 'es-toolkit'

import { COUNT_KINDS } from '@/generated/profile/content/counts'
import { PROJECTS } from '@/generated/profile/content/projects'
import { getProjectCounts } from './project-counts'

/**
 * Every project's counts added up, in the order the glyphs show them, the
 * repos and packages to chart them from, and how many charts may show.
 *
 * Each project's counts are those its own glyphs show, PRs included where
 * they don't. A kind of count is only charted where this site fetched it for
 * every project that has it, so each chart ends at the total it's shown with;
 * otherwise its repos or packages are empty.
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
  const shown = COUNT_KINDS.flatMap(({ key, icon, noun }) => {
    const counted = projects.filter(({ counts }) => counts[key] !== undefined)
    return counted.length === 0
      ? []
      : [
          {
            key,
            icon,
            noun,
            count: sumBy(counted, ({ counts }) => counts[key] ?? 0),
          },
        ]
  })
  const hasDownloads = shown.some(({ key }) => key === 'downloads')
  return {
    shown,
    repos: activityFetched ? projects.map(({ repo }) => repo) : [],
    packages:
      downloadsFetched && hasDownloads
        ? projects.map(({ pkg }) => pkg).filter(isNotNil)
        : [],
    // Commits and PRs from the repos, and downloads from the packages.
    chartCount:
      (activityFetched ? 2 : 0) + (downloadsFetched && hasDownloads ? 1 : 0),
  }
}
