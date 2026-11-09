/**
 * Fetches each project repo's commits and pull requests in all, which its
 * counts' glyphs show.
 *
 * Writes src/generated/repo-activity-totals.ts, gitignored. Reads the repos
 * from the content `pnpm fetch:profile` copied, so run that first. Needs a
 * `GITHUB_TOKEN`, since a build makes about as many requests as GitHub allows
 * an hour without one; without it, every repo is skipped. A private repo
 * needs a token granted it. A repo that can't be read is left out with a
 * warning, and its glyphs keep the profile's counts, rather than failing the
 * build, unless `REQUIRE_FETCHED_DATA=true`, as the deploy sets it. With
 * `REUSE_FETCHED_DATA=true`, it keeps the file where it already exists, as a
 * preview build does with recent data it restored from its cache.
 */

import { GENERATED_DIR } from './shared/constants.ts'
import { exitIfReusing, writeGenerated } from './shared/generated.ts'
import { fetchOk } from './shared/http.ts'
import { findShortfall, getProjectValues } from './shared/projects.ts'
import { reportSkipped } from './shared/skipped.ts'

const OUT_FILE = `${GENERATED_DIR}/repo-activity-totals.ts`
const OWNER = 'bvandrc'
// Actions sets this, to GitHub Enterprise's API on an Enterprise server.
const API_URL = process.env.GITHUB_API_URL || 'https://api.github.com'
// Actions passes an unset secret as an empty string.
const token = process.env.GITHUB_TOKEN || undefined

/** How many items a paginated GitHub list holds, following its Link headers. */
const countAll = async (path: string) => {
  let count = 0
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
    count += ((await res.json()) as unknown[]).length
    url = res.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1]
  }
  return count
}

/** A repo's commits on its default branch, and its pull requests, each counted in all. */
const fetchActivity = async (repo: string) => {
  const [commits, prs] = await Promise.all([
    countAll(`/repos/${OWNER}/${repo}/commits`),
    countAll(`/repos/${OWNER}/${repo}/pulls?state=all`),
  ])
  return { commits, prs }
}

exitIfReusing('git activity', [OUT_FILE])

const repos = getProjectValues('repo')

const entries: string[] = []
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
    const { commits, prs } = result.value
    // Fewer than the profile's older count means the fetch missed some.
    const shortfall = findShortfall(repo, { commits, prs })
    if (shortfall) {
      reportSkipped(`commits and PRs for ${repo}`, shortfall)
    } else {
      entries.push(`  '${repo}': { commits: ${commits}, prs: ${prs} },`)
    }
  })
}

await writeGenerated(
  OUT_FILE,
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
console.log(
  `git activity: totals for ${entries.length} of ${repos.length} repos`
)
