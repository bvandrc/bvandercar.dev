/**
 * Fetches each project repo's commits and merged pull requests in all, which
 * its counts' glyphs show, and both day by day, for the commits chart in
 * its counts' tooltip and the footer's charts of every project's together.
 *
 * Writes the totals to src/generated/repo-activity-totals.ts, and the daily
 * histories to src/generated/repo-activity.ts, which only the lazily loaded
 * charts import, for the same repos; both gitignored. Reads the repos
 * from the content `pnpm fetch:profile` copied, so run that first. Needs a
 * `GITHUB_TOKEN`, since a build makes about as many requests as GitHub allows
 * an hour without one; without it, every repo is skipped. A private repo
 * needs a token granted it. A repo that can't be read is left out with a
 * warning, and its glyphs keep the profile's counts, rather than failing the
 * build, unless `REQUIRE_FETCHED_DATA=true`, as the deploy sets it. With
 * `REUSE_FETCHED_DATA=true`, it keeps the file where it already exists, as a
 * preview build does with recent data it restored from its cache.
 */

import { countBy } from 'es-toolkit'
import { Octokit } from 'octokit'

import type { ActivityHistory, ActivityTotals } from '../shared/counts.ts'
import { earlierDay, isoDate, listDays } from '../shared/dates.ts'
import { GITHUB_OWNER } from '../shared/github.ts'
import { GENERATED_DIR } from './shared/constants.ts'
import { exitIfReusing, writeGenerated } from './shared/generated.ts'
import { findShortfall, getProjectValues } from './shared/projects.ts'
import { reportSkipped } from './shared/skipped.ts'

const TOTALS_FILE = `${GENERATED_DIR}/repo-activity-totals.ts`
const HISTORY_FILE = `${GENERATED_DIR}/repo-activity.ts`
// Actions sets this, to GitHub Enterprise's API on an Enterprise server.
const API_URL = process.env.GITHUB_API_URL || 'https://api.github.com'
// Actions passes an unset secret as an empty string.
const token = process.env.GITHUB_TOKEN || undefined

// How many times a rate-limited request is retried, after waiting as long as
// GitHub asks, before the repo's counts are left out.
const MAX_RATE_LIMIT_RETRIES = 2

/** Whether to retry a rate-limited request, as Octokit's throttling asks. */
const shouldRetryRateLimit = (
  _retryAfter: number,
  _options: unknown,
  _octokit: unknown,
  retryCount: number
) => retryCount < MAX_RATE_LIMIT_RETRIES

const octokit = new Octokit({
  auth: token,
  baseUrl: API_URL,
  userAgent: 'bvandercar.dev',
  throttle: {
    onRateLimit: shouldRetryRateLimit,
    onSecondaryRateLimit: shouldRetryRateLimit,
  },
})

/**
 * A repo's commits on its default branch, and its merged pull requests, each
 * counted in all, and by the day each commit was made and each pull request
 * merged, from the day of its first commit or merged pull request through
 * today.
 *
 * Every commit and pull request is in a day, so the days sum to the totals.
 */
const fetchActivity = async (repo: string) => {
  const repoParams = { owner: GITHUB_OWNER, repo, per_page: 100 }
  // Octokit follows each list's pages, and retries one GitHub fails briefly.
  const [commits, pulls] = await Promise.all([
    octokit.paginate(octokit.rest.repos.listCommits, repoParams),
    octokit.paginate(octokit.rest.pulls.list, { ...repoParams, state: 'all' }),
  ])
  const today = isoDate(Date.now())
  const commitDays = commits.map(({ commit }) =>
    // A commit can lack a committer, so its author dates it instead, and one
    // with neither still counts, as today's. One dated ahead, by a skewed
    // clock, counts as today's too, so the days still sum to the total.
    earlierDay(
      isoDate(
        Date.parse(commit.committer?.date ?? commit.author?.date ?? Date())
      ),
      today
    )
  )
  // Ones closed unmerged, or still open, never landed, so don't count.
  const merged = pulls.flatMap(({ created_at, merged_at }) =>
    merged_at === null ? [] : [{ created_at, merged_at }]
  )
  const prDays = merged.map(({ created_at }) => isoDate(Date.parse(created_at)))
  // A pull request counts on the day it merged, when it landed, or today's if
  // it merged since today was read.
  const mergeDays = merged.map(({ merged_at }) =>
    earlierDay(isoDate(Date.parse(merged_at)), today)
  )
  const firstDay = [today, ...commitDays, ...prDays].reduce(earlierDay)
  const days = listDays(firstDay, today)
  /** How many of `dated` fall on each of the history's days. */
  const countDaily = (dated: string[]) => {
    const counts = countBy(dated, (day) => day)
    return days.map((day) => counts[day] ?? 0)
  }
  return {
    commits: commits.length,
    prs: merged.length,
    history: {
      firstDay,
      lastDay: today,
      commits: countDaily(commitDays),
      prs: countDaily(mergeDays),
    },
  }
}

exitIfReusing('git activity', [TOTALS_FILE, HISTORY_FILE])

const repos = getProjectValues('repo')

const totals: Record<string, ActivityTotals> = {}
const histories: Record<string, ActivityHistory> = {}
if (token === undefined) {
  reportSkipped("every repo's commits and PRs", 'GITHUB_TOKEN is not set')
} else {
  const results = await Promise.allSettled(repos.map(fetchActivity))
  results.forEach((result, index) => {
    const repo = repos[index]
    if (result.status === 'rejected') {
      reportSkipped(`commits and PRs for ${repo}`, result.reason)
      return
    }
    const { commits, prs, history } = result.value
    // Fewer than the profile's older count means the fetch missed some.
    const shortfall = findShortfall(repo, { commits, prs })
    if (shortfall) {
      reportSkipped(`commits and PRs for ${repo}`, shortfall)
    } else {
      totals[repo] = { commits, prs }
      histories[repo] = history
    }
  })
}

await writeGenerated(
  TOTALS_FILE,
  'fetch:git-activity',
  "import type { ActivityTotals } from '~/counts'",
  [
    {
      name: 'REPO_ACTIVITY_TOTALS',
      doc: "Each project repo's commits on its default branch, and merged pull requests, in all, keyed by repo name.",
      type: 'Record<string, ActivityTotals | undefined>',
      value: totals,
    },
  ]
)
await writeGenerated(
  HISTORY_FILE,
  'fetch:git-activity',
  "import type { ActivityHistory } from '~/counts'",
  [
    {
      name: 'REPO_ACTIVITY',
      doc: "Each project repo's commits, and merged pull requests, per day, keyed by repo name.",
      type: 'Record<string, ActivityHistory | undefined>',
      value: histories,
    },
  ]
)
console.log(
  `git activity: totals and daily history for ${Object.keys(totals).length} of ${repos.length} repos`
)
