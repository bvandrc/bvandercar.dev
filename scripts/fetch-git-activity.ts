/**
 * Fetches each project repo's commits and pull requests: in all, which its
 * counts' glyphs show, and week by week, for the commits chart in its counts'
 * tooltip.
 *
 * Writes src/generated/repo-activity-totals.ts and
 * src/generated/repo-activity.ts, gitignored, for the same repos. Reads the repos
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

const WEEK_MS = 7 * DAY_MS

/** The start of the Monday, UTC, of the week `time` falls in. */
const getWeekStart = (time: number) => {
  const dayStart = Math.floor(time / DAY_MS) * DAY_MS
  // getUTCDay counts from Sunday; this counts days since Monday.
  const daysSinceMonday = (new Date(dayStart).getUTCDay() + 6) % 7
  return dayStart - daysSinceMonday * DAY_MS
}

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
 * in all, and by the week each was made or opened in, from its first week
 * through the one under way.
 *
 * Every commit and PR is in a week, so the weeks sum to the totals.
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
  const commitWeeks = commits.map(({ commit }) =>
    // A commit can lack a committer, so its author dates it instead, and one
    // with neither still counts, as this week's.
    getWeekStart(
      Date.parse(commit.committer?.date ?? commit.author?.date ?? Date())
    )
  )
  const prWeeks = pulls.map(({ created_at }) =>
    getWeekStart(Date.parse(created_at))
  )
  const now = Date.now()
  // A running total never drops, so the week under way is charted too.
  const lastWeek = getWeekStart(now)
  const firstWeek = Math.min(lastWeek, ...commitWeeks, ...prWeeks)
  const commitCounts = countBy(commitWeeks, String)
  const prCounts = countBy(prWeeks, String)
  const weeks: number[] = []
  for (let week = firstWeek; week <= lastWeek; week += WEEK_MS) {
    weeks.push(week)
  }
  return {
    commits: commits.length,
    prs: pulls.length,
    history: {
      firstWeek: isoDate(firstWeek),
      lastDay: isoDate(now),
      commits: weeks.map((week) => commitCounts[week] ?? 0),
      prs: weeks.map((week) => prCounts[week] ?? 0),
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
        `  '${repo}': { firstWeek: '${history.firstWeek}', lastDay: '${history.lastDay}', commits: [${history.commits.join(', ')}], prs: [${history.prs.join(', ')}] },`
      )
    }
  })
}

await writeGenerated(
  TOTALS_FILE,
  'fetch:git-activity',
  `/** Each project repo's commits on its default branch, and pull requests, in all, keyed by repo name. */
export const REPO_ACTIVITY_TOTALS: Record<
  string,
  { commits: number; prs: number } | undefined
> = {
${entries.join('\n')}
}
`
)
await writeGenerated(
  HISTORY_FILE,
  'fetch:git-activity',
  `export type WeeklyActivity = {
  /** ISO date of the Monday the first week starts on */
  firstWeek: string
  /** ISO date the history was read, which ends the last week, the one under way */
  lastDay: string
  /** Commits on the default branch in each week, oldest first; they sum to the repo's total */
  commits: number[]
  /** Pull requests opened in each of the same weeks */
  prs: number[]
}

/** Each project repo's commits and pull requests per week, keyed by repo name. */
export const REPO_ACTIVITY: Record<string, WeeklyActivity | undefined> = {
${historyEntries.join('\n')}
}
`
)
console.log(
  `git activity: totals and weekly history for ${entries.length} of ${repos.length} repos`
)
