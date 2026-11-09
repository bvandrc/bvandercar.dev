/**
 * Fetches each project repo's commits and pull requests in all, which its
 * counts' glyphs show, and its commits day by day, for the commits chart in
 * its counts' tooltip.
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

import type { ActivityTotals, CommitHistory } from '../shared/counts.ts'
import { earlierDay, isoDate, listDays } from '../shared/dates.ts'
import { GITHUB_OWNER } from '../shared/github.ts'
import { GENERATED_DIR } from './shared/constants.ts'
import { exitIfReusing, writeGenerated } from './shared/generated.ts'
import { fetchOk } from './shared/http.ts'
import { findShortfall, getProjectValues } from './shared/projects.ts'
import { reportSkipped } from './shared/skipped.ts'

const TOTALS_FILE = `${GENERATED_DIR}/repo-activity-totals.ts`
const HISTORY_FILE = `${GENERATED_DIR}/repo-activity.ts`
// Actions sets this, to GitHub Enterprise's API on an Enterprise server.
const API_URL = process.env.GITHUB_API_URL || 'https://api.github.com'
// Actions passes an unset secret as an empty string.
const token = process.env.GITHUB_TOKEN || undefined

/** Every item of a paginated GitHub list, following its Link headers. */
const fetchAll = async <T>(path: string) => {
  const items: T[] = []
  let url: string | undefined =
    `${API_URL}${path}${path.includes('?') ? '&' : '?'}per_page=100`
  while (url) {
    const res: Response = await fetchOk(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'bvandercar.dev',
      },
    })
    items.push(...((await res.json()) as T[]))
    url = res.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1]
  }
  return items
}

/**
 * A repo's commits on its default branch, and its pull requests, each counted
 * in all, and its commits by the day each was made, from the day of its first
 * commit or pull request through today.
 *
 * Every commit is in a day, so the days sum to the commits' total.
 */
const fetchActivity = async (repo: string) => {
  const repoPath = `/repos/${GITHUB_OWNER}/${repo}`
  const [commits, pulls] = await Promise.all([
    fetchAll<{
      commit: {
        committer: { date: string } | null
        author: { date: string } | null
      }
    }>(`${repoPath}/commits`),
    fetchAll<{ created_at: string }>(`${repoPath}/pulls?state=all`),
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
  const prDays = pulls.map(({ created_at }) => isoDate(Date.parse(created_at)))
  const firstDay = [today, ...commitDays, ...prDays].reduce(earlierDay)
  const counts = countBy(commitDays, (day) => day)
  return {
    commits: commits.length,
    prs: pulls.length,
    history: {
      firstDay,
      lastDay: today,
      commits: listDays(firstDay, today).map((day) => counts[day] ?? 0),
    },
  }
}

exitIfReusing('git activity', [TOTALS_FILE, HISTORY_FILE])

const repos = getProjectValues('repo')

const totals: Record<string, ActivityTotals> = {}
const histories: Record<string, CommitHistory> = {}
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
      doc: "Each project repo's commits on its default branch, and pull requests, in all, keyed by repo name.",
      type: 'Record<string, ActivityTotals | undefined>',
      value: totals,
    },
  ]
)
await writeGenerated(
  HISTORY_FILE,
  'fetch:git-activity',
  "import type { CommitHistory } from '~/counts'",
  [
    {
      name: 'REPO_ACTIVITY',
      doc: "Each project repo's commits per day, keyed by repo name.",
      type: 'Record<string, CommitHistory | undefined>',
      value: histories,
    },
  ]
)
console.log(
  `git activity: totals and daily history for ${Object.keys(totals).length} of ${repos.length} repos`
)
