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

import { DAY_MS, isoDate } from '../shared/dates.ts'
import { GENERATED_DIR } from './shared/constants.ts'
import { exitIfReusing, writeGenerated } from './shared/generated.ts'
import { fetchOk } from './shared/http.ts'
import { findShortfall, getProjectValues } from './shared/projects.ts'
import { reportSkipped } from './shared/skipped.ts'

const TOTALS_FILE = `${GENERATED_DIR}/repo-activity-totals.ts`
const HISTORY_FILE = `${GENERATED_DIR}/repo-activity.ts`
const OWNER = 'bvandrc'
// Actions sets this, to GitHub Enterprise's API on an Enterprise server.
const API_URL = process.env.GITHUB_API_URL || 'https://api.github.com'
// Actions passes an unset secret as an empty string.
const token = process.env.GITHUB_TOKEN || undefined

/** The start of the day, UTC, `time` falls on. */
const getDayStart = (time: number) => Math.floor(time / DAY_MS) * DAY_MS

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
  const [commits, pulls] = await Promise.all([
    fetchAll<{
      commit: {
        committer: { date: string } | null
        author: { date: string } | null
      }
    }>(`/repos/${OWNER}/${repo}/commits`),
    fetchAll<{ created_at: string }>(`/repos/${OWNER}/${repo}/pulls?state=all`),
  ])
  const today = getDayStart(Date.now())
  const commitDays = commits.map(({ commit }) =>
    // A commit can lack a committer, so its author dates it instead, and one
    // with neither still counts, as today's. One dated ahead, by a skewed
    // clock, counts as today's too, so the days still sum to the total.
    Math.min(
      getDayStart(
        Date.parse(commit.committer?.date ?? commit.author?.date ?? Date())
      ),
      today
    )
  )
  const prDays = pulls.map(({ created_at }) =>
    getDayStart(Date.parse(created_at))
  )
  const firstDay = Math.min(today, ...commitDays, ...prDays)
  const counts = countBy(commitDays, String)
  const daily: number[] = []
  for (let day = firstDay; day <= today; day += DAY_MS) {
    daily.push(counts[day] ?? 0)
  }
  return {
    commits: commits.length,
    prs: pulls.length,
    history: {
      firstDay: isoDate(firstDay),
      lastDay: isoDate(today),
      commits: daily,
    },
  }
}

exitIfReusing('git activity', [TOTALS_FILE, HISTORY_FILE])

const repos = getProjectValues('repo')

const entries: string[] = []
const historyEntries: string[] = []
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
      entries.push(`  '${repo}': { commits: ${commits}, prs: ${prs} },`)
      historyEntries.push(
        `  '${repo}': { firstDay: '${history.firstDay}', lastDay: '${history.lastDay}', commits: [${history.commits.join(', ')}] },`
      )
    }
  })
}

await writeGenerated(
  TOTALS_FILE,
  'fetch:git-activity',
  `import type { ActivityTotals } from '~/counts'

/** Each project repo's commits on its default branch, and pull requests, in all, keyed by repo name. */
export const REPO_ACTIVITY_TOTALS: Record<string, ActivityTotals | undefined> = {
${entries.join('\n')}
}
`
)
await writeGenerated(
  HISTORY_FILE,
  'fetch:git-activity',
  `import type { CommitHistory } from '~/counts'

/** Each project repo's commits per day, keyed by repo name. */
export const REPO_ACTIVITY: Record<string, CommitHistory | undefined> = {
${historyEntries.join('\n')}
}
`
)
console.log(
  `git activity: totals and daily history for ${entries.length} of ${repos.length} repos`
)
