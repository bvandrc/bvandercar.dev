/**
 * Fetches each project repo's commits and pull requests per week, whose
 * totals its counts' glyphs show.
 *
 * Writes src/generated/repo-activity.ts, gitignored. Reads the repos from the
 * content `pnpm fetch:profile` copied, so run that first. Needs a
 * `GITHUB_TOKEN`, since a build makes about as many requests as GitHub allows
 * an hour without one; without it, every repo is skipped. A private repo
 * needs a token granted it. A repo that can't be read is left out with a
 * warning, and its glyphs keep the profile's counts, rather than failing the
 * build. With `REUSE_FETCHED_DATA=true`, it keeps the file where it already
 * exists, as a preview build does with recent data it restored from its cache.
 */

import { countBy } from 'es-toolkit'

import { DAY_MS, GENERATED_DIR } from './shared/constants.ts'
import { isoDate } from './shared/dates.ts'
import { getErrorMessage } from './shared/errors.ts'
import { exitIfReusing, writeGenerated } from './shared/generated.ts'
import { readProjectValues } from './shared/projects.ts'

const OUT_FILE = `${GENERATED_DIR}/repo-activity.ts`
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
    const res: Response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'bvandercar.dev',
      },
    })
    if (!res.ok) {
      throw new Error(`GitHub API ${res.status} for ${url}`)
    }
    items.push(...((await res.json()) as T[]))
    url = res.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1]
  }
  return items
}

/**
 * A repo's commits on its default branch, and its pull requests by when they
 * were opened, counted per week from its first through the one under way.
 *
 * Every commit and PR is counted, so the weeks sum to the repo's totals.
 * Undefined for a repo with neither.
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
  // Through the week under way, so the weeks sum to every commit and PR.
  const lastWeek = getWeekStart(now)
  const firstWeek = Math.min(...commitWeeks, ...prWeeks)
  if (!(firstWeek <= lastWeek)) {
    return undefined
  }
  const commitCounts = countBy(commitWeeks, String)
  const prCounts = countBy(prWeeks, String)
  const weeks: number[] = []
  for (let week = firstWeek; week <= lastWeek; week += WEEK_MS) {
    weeks.push(week)
  }
  return {
    firstWeek: isoDate(firstWeek),
    lastDay: isoDate(now),
    commits: weeks.map((week) => commitCounts[week] ?? 0),
    prs: weeks.map((week) => prCounts[week] ?? 0),
  }
}

exitIfReusing('git activity', [OUT_FILE])

const repos = await readProjectValues('repo')

const entries: string[] = []
if (token === undefined) {
  console.warn(
    "::notice::GITHUB_TOKEN is not set, so every project's glyphs keep the profile's counts"
  )
} else {
  const results = await Promise.allSettled(repos.map(fetchActivity))
  results.forEach((result, index) => {
    const repo = repos[index]
    if (result.status === 'rejected') {
      console.warn(
        `::warning::Activity for ${repo} could not be read, so its glyphs keep the profile's counts: ${getErrorMessage(result.reason)}`
      )
    } else if (result.value) {
      const { firstWeek, lastDay, commits, prs } = result.value
      entries.push(
        `  '${repo}': { firstWeek: '${firstWeek}', lastDay: '${lastDay}', commits: [${commits.join(', ')}], prs: [${prs.join(', ')}] },`
      )
    }
  })
}

await writeGenerated(
  OUT_FILE,
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
${entries.join('\n')}
}
`
)
console.log(
  `git activity: weekly history for ${entries.length} of ${repos.length} repos`
)
