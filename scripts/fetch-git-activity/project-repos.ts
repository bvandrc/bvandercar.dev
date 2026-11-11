/**
 * The project repos' side of `pnpm fetch:git-activity`: each repo's commits
 * and merged pull requests, by anyone, in all and day by day, which its
 * card's glyphs show and its tooltip charts.
 */

import type { ActivityHistory, ActivityTotals } from '../../shared/counts.ts'
import { isoDate } from '../../shared/dates.ts'
import { GITHUB_OWNER } from '../../shared/github.ts'
import { octokit, token } from '../shared/octokit.ts'
import { findShortfall, getProjectValues } from '../shared/projects.ts'
import { reportSkipped } from '../shared/skipped.ts'
import { buildActivityHistory, toDay } from './history.ts'

/**
 * A repo's commits on its default branch, and its merged pull requests, each
 * counted in all, and by the day each commit was made and each pull request
 * merged, from the day of its first commit or pull request through today.
 */
const fetchRepoActivity = async (repo: string) => {
  const repoParams = { owner: GITHUB_OWNER, repo, per_page: 100 }
  // Octokit follows each list's pages, and retries one GitHub fails briefly.
  const [commits, pulls] = await Promise.all([
    octokit.paginate(octokit.rest.repos.listCommits, repoParams),
    octokit.paginate(octokit.rest.pulls.list, { ...repoParams, state: 'all' }),
  ])
  const today = isoDate(Date.now())
  // Ones closed unmerged, or still open, never landed, so don't count.
  const merged = pulls.flatMap(({ created_at, merged_at }) =>
    merged_at === null ? [] : [{ created_at, merged_at }]
  )
  return {
    totals: { commits: commits.length, prs: merged.length },
    history: buildActivityHistory(
      {
        commitDays: commits.map(({ commit }) =>
          // A commit can lack a committer, so its author dates it instead,
          // and one with neither still counts, as today's.
          toDay(commit.committer?.date ?? commit.author?.date ?? Date(), today)
        ),
        prDays: merged.map(({ merged_at }) => toDay(merged_at, today)),
        startDays: merged.map(({ created_at }) =>
          isoDate(Date.parse(created_at))
        ),
      },
      today
    ),
  }
}

/**
 * Each project repo's commits and merged pull requests, in all and by day,
 * keyed by repo name, and how many repos there are.
 *
 * Needs a `GITHUB_TOKEN`, since a build makes about as many requests as
 * GitHub allows an hour without one, and a private repo one granted it. A
 * repo it can't read, or reads fewer of than the profile's older counts, is
 * left out with a warning, and the profile's counts stand in for it.
 */
export const fetchProjectReposActivity = async () => {
  const repos = getProjectValues('repo')
  const totals: Record<string, ActivityTotals> = {}
  const histories: Record<string, ActivityHistory> = {}
  if (token === undefined) {
    reportSkipped("every repo's commits and PRs", 'GITHUB_TOKEN is not set')
    return { totals, histories, repoCount: repos.length }
  }
  const results = await Promise.allSettled(repos.map(fetchRepoActivity))
  results.forEach((result, index) => {
    const repo = repos[index]
    if (result.status === 'rejected') {
      reportSkipped(`commits and PRs for ${repo}`, result.reason)
      return
    }
    // Fewer than the profile's older count means the fetch missed some.
    const shortfall = findShortfall(repo, result.value.totals)
    if (shortfall) {
      reportSkipped(`commits and PRs for ${repo}`, shortfall)
    } else {
      totals[repo] = result.value.totals
      histories[repo] = result.value.history
    }
  })
  return { totals, histories, repoCount: repos.length }
}
