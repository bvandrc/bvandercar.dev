/**
 * Fetches each project repo's commits per day, for the activity chart in its
 * counts tooltip, and its commits and pull requests in all, for its counts.
 *
 * Writes the daily histories to src/generated/repo-activity.ts, which only the
 * lazily loaded charts import, and the totals to
 * src/generated/repo-activity-totals.ts; both gitignored. Reads the repos
 * from the content `pnpm fetch:profile` copied, so run that first. Needs a
 * `GITHUB_TOKEN`, since a build makes about as many requests as GitHub allows
 * an hour without one; without it, every repo is skipped. A private repo
 * needs a token granted it. A repo that can't be read is left out with a
 * warning, and its card shows no chart, rather than failing the build. With
 * `REUSE_FETCHED_DATA=true`, it keeps both files where they already exist, as
 * a preview build does with recent ones it restored from its cache.
 */

import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { countBy } from 'es-toolkit'

const PROJECTS_FILE = 'src/generated/profile/content/projects.ts'
const OUT_FILE = 'src/generated/repo-activity.ts'
const TOTALS_FILE = 'src/generated/repo-activity-totals.ts'
const OWNER = 'bvandrc'
// Actions sets this, to GitHub Enterprise's API on an Enterprise server.
const API_URL = process.env.GITHUB_API_URL || 'https://api.github.com'
// Actions passes an unset secret as an empty string.
const token = process.env.GITHUB_TOKEN || undefined

const DAY_MS = 24 * 60 * 60 * 1000

const isoDate = (time: number) => new Date(time).toISOString().slice(0, 10)

/** The start of the day, UTC, `time` falls on. */
const getDayStart = (time: number) => Math.floor(time / DAY_MS) * DAY_MS

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
 * A repo's commits on its default branch, counted per day from its first
 * commit or pull request through today, and its commits and pull requests in
 * all.
 *
 * Every commit is counted, so the days sum to the repo's total. Undefined for
 * a repo with neither.
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
  const firstDay = Math.min(...commitDays, ...prDays)
  if (!(firstDay <= today)) {
    return undefined
  }
  const counts = countBy(commitDays, String)
  const daily: number[] = []
  for (let day = firstDay; day <= today; day += DAY_MS) {
    daily.push(counts[day] ?? 0)
  }
  return {
    firstDay: isoDate(firstDay),
    lastDay: isoDate(today),
    commits: daily,
    totals: { commits: commits.length, prs: pulls.length },
  }
}

if (
  process.env.REUSE_FETCHED_DATA === 'true' &&
  existsSync(OUT_FILE) &&
  existsSync(TOTALS_FILE)
) {
  console.log(`repo activity: reusing ${OUT_FILE} and ${TOTALS_FILE}`)
  process.exit(0)
}

const projects = await readFile(PROJECTS_FILE, 'utf8')
const repos = [
  ...new Set(
    [...projects.matchAll(/\brepo:\s*'([^']+)'/g)].map(([, repo]) => repo)
  ),
].sort()

const entries: string[] = []
const totalEntries: string[] = []
if (token === undefined) {
  console.warn(
    '::notice::GITHUB_TOKEN is not set, so no project shows an activity chart'
  )
} else {
  const results = await Promise.allSettled(repos.map(fetchActivity))
  results.forEach((result, index) => {
    const repo = repos[index]
    if (result.status === 'rejected') {
      console.warn(
        `::warning::Activity for ${repo} could not be read, so its card shows no chart: ${result.reason instanceof Error ? result.reason.message : result.reason}`
      )
    } else if (result.value) {
      const { firstDay, lastDay, commits, totals } = result.value
      entries.push(
        `  '${repo}': { firstDay: '${firstDay}', lastDay: '${lastDay}', commits: [${commits.join(', ')}] },`
      )
      totalEntries.push(
        `  '${repo}': { commits: ${totals.commits}, prs: ${totals.prs} },`
      )
    }
  })
}

await mkdir('src/generated', { recursive: true })
await writeFile(
  TOTALS_FILE,
  `// GENERATED FILE — do not edit directly. Run \`pnpm fetch:activity\`.

/** Each project repo's commits on its default branch, and pull requests, in all, keyed by repo name. */
export const REPO_ACTIVITY_TOTALS: Record<
  string,
  { commits: number; prs: number } | undefined
> = {
${totalEntries.join('\n')}
}
`
)
await writeFile(
  OUT_FILE,
  `// GENERATED FILE — do not edit directly. Run \`pnpm fetch:activity\`.

export type CommitHistory = {
  /** ISO date of the repo's first commit or pull request */
  firstDay: string
  /** ISO date the history was read */
  lastDay: string
  /** Commits on the default branch each day from \`firstDay\` through \`lastDay\`, oldest first; they sum to the repo's total */
  commits: number[]
}

/** Each project repo's commits per day, keyed by repo name. */
export const REPO_ACTIVITY: Record<string, CommitHistory | undefined> = {
${entries.join('\n')}
}
`
)
console.log(
  `repo activity: daily history for ${entries.length} of ${repos.length} repos`
)
