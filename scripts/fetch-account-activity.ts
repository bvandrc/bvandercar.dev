/**
 * Fetches every commit and merged pull request the GitHub account made, in
 * any repo, its own and others', in all and day by day, for the footer's
 * totals and their charts.
 *
 * Commits come from GitHub's commit search, which reads every repo's default
 * branch but no fork's, so each of the account's public forks is read branch
 * by branch too, for the work it never merged anywhere. A commit found more
 * than once, as in a fork of a repo it landed in, counts once. Pull requests
 * come from GitHub's issue search, each on the day it merged. Search reads a
 * private repo only where `GITHUB_TOKEN` can.
 *
 * Writes the totals to src/generated/account-activity-totals.ts, and the
 * daily history to src/generated/account-activity.ts, which only the lazily
 * loaded charts import; both gitignored. Without a token, or where a request
 * fails, both are left undefined with a warning, and the projects' own
 * counts, added up, stand in, unless `REQUIRE_FETCHED_DATA=true`, as the
 * deploy sets it. With `REUSE_FETCHED_DATA=true`, it keeps the files where
 * they already exist, as a preview build does with recent data it restored.
 * With `SKIP_ACCOUNT_ACTIVITY=true`, it leaves both undefined without asking
 * GitHub at all.
 */

import { countBy, uniqBy } from 'es-toolkit'

import type { ActivityHistory, ActivityTotals } from '../shared/counts.ts'
import {
  addDays,
  earlierDay,
  getDaysBetween,
  isoDate,
  listDays,
} from '../shared/dates.ts'
import { GITHUB_OWNER } from '../shared/github.ts'
import { GENERATED_DIR } from './shared/constants.ts'
import { exitIfReusing, writeGenerated } from './shared/generated.ts'
import { octokit, token } from './shared/octokit.ts'
import { reportSkipped } from './shared/skipped.ts'

const TOTALS_FILE = `${GENERATED_DIR}/account-activity-totals.ts`
const HISTORY_FILE = `${GENERATED_DIR}/account-activity.ts`

// The most results GitHub's search gives for one query, past which a query
// is split into shorter stretches of dates.
const SEARCH_MAX_RESULTS = 1000
// The most results a search gives a page.
const SEARCH_PAGE_SIZE = 100
// Before GitHub launched, so every search starts before anything it holds.
const SEARCH_START = '2008-01-01'

/** A commit, or pull request, the account made: what tells it apart from the rest, and the ISO time it counts at. */
type Dated = { id: string; time: string }

/** One page of a search's results, with how many it finds in all, and whether it gave up before finding them all. */
type SearchPage = { total: number; incomplete: boolean; items: Dated[] }

/** One of GitHub's searches, for results of the account's dated by a qualifier. */
type DatedSearch = {
  /** The search's own terms, like `author:bvandrc` */
  query: string
  /** The qualifier that dates a result, like `merged` */
  qualifier: string
  /** The `page`th page, from 1, of what `q` finds */
  getPage: (q: string, page: number) => Promise<SearchPage>
}

/**
 * Every result of `search` dated from `from` through `to`, ISO dates.
 *
 * Splits the dates in two wherever they hold more than search gives, and
 * fails where search gave up early, rather than undercount.
 */
const searchDated = async (
  search: DatedSearch,
  from: string,
  to: string
): Promise<Dated[]> => {
  const q = `${search.query} ${search.qualifier}:${from}..${to}`
  /** The `page`th page of what `q` finds, failing where search gave up early. */
  const getPage = async (page: number) => {
    const result = await search.getPage(q, page)
    if (result.incomplete) {
      throw new Error(`GitHub's search gave up early on "${q}"`)
    }
    return result
  }
  // The first page says how many there are in all.
  const first = await getPage(1)
  if (first.total > SEARCH_MAX_RESULTS) {
    if (from === to) {
      throw new Error(`"${q}" finds more than search gives for one day`)
    }
    const middle = addDays(from, Math.floor(getDaysBetween(from, to) / 2))
    return [
      ...(await searchDated(search, from, middle)),
      ...(await searchDated(search, addDays(middle, 1), to)),
    ]
  }
  const items = [...first.items]
  for (
    let page = 2;
    page <= Math.ceil(first.total / SEARCH_PAGE_SIZE);
    page++
  ) {
    items.push(...(await getPage(page)).items)
  }
  return items
}

/** The account's commits on any repo's default branch, by their committer's date, as the projects' own are. */
const COMMIT_SEARCH: DatedSearch = {
  query: `author:${GITHUB_OWNER}`,
  qualifier: 'committer-date',
  getPage: async (q, page) => {
    const { data } = await octokit.rest.search.commits({
      q,
      page,
      per_page: SEARCH_PAGE_SIZE,
    })
    return {
      total: data.total_count,
      incomplete: data.incomplete_results,
      items: data.items.map(({ sha, commit }) => ({
        id: sha,
        time: commit.committer?.date ?? commit.author.date,
      })),
    }
  },
}

/** The account's merged pull requests, in any repo, by the day each merged. */
const PULL_SEARCH: DatedSearch = {
  query: `type:pr author:${GITHUB_OWNER} is:merged`,
  qualifier: 'merged',
  getPage: async (q, page) => {
    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q,
      page,
      per_page: SEARCH_PAGE_SIZE,
    })
    return {
      total: data.total_count,
      incomplete: data.incomplete_results,
      items: data.items.flatMap(({ node_id, pull_request }) =>
        // Every one is merged, by the query; this keeps the type honest.
        pull_request?.merged_at
          ? [{ id: node_id, time: pull_request.merged_at }]
          : []
      ),
    }
  },
}

/**
 * The account's commits on every branch of each of its public forks, which
 * commit search leaves out.
 *
 * A fork's branches hold the repo it was forked from's history too, so only
 * the account's own commits are read.
 */
const fetchForkCommits = async (): Promise<Dated[]> => {
  const repos = await octokit.paginate(octokit.rest.repos.listForUser, {
    username: GITHUB_OWNER,
    type: 'owner',
    per_page: 100,
  })
  const commits: Dated[] = []
  for (const { name, fork } of repos) {
    if (!fork) {
      continue
    }
    const repoParams = { owner: GITHUB_OWNER, repo: name, per_page: 100 }
    const branches = await octokit.paginate(
      octokit.rest.repos.listBranches,
      repoParams
    )
    for (const branch of branches) {
      const branchCommits = await octokit.paginate(
        octokit.rest.repos.listCommits,
        { ...repoParams, sha: branch.name, author: GITHUB_OWNER }
      )
      commits.push(
        ...branchCommits.map(({ sha, commit }) => ({
          id: sha,
          // A commit can lack a committer, so its author dates it instead,
          // and one with neither counts as today's.
          time: commit.committer?.date ?? commit.author?.date ?? Date(),
        }))
      )
    }
  }
  return commits
}

/**
 * The account's commits and merged pull requests, in all and by day, from
 * the day of its first through today.
 *
 * A commit found more than once counts once, so the days sum to the totals.
 */
const fetchAccountActivity = async () => {
  const today = isoDate(Date.now())
  const commits = uniqBy(
    [
      ...(await searchDated(COMMIT_SEARCH, SEARCH_START, today)),
      ...(await fetchForkCommits()),
    ],
    ({ id }) => id
  )
  const pulls = uniqBy(
    await searchDated(PULL_SEARCH, SEARCH_START, today),
    ({ id }) => id
  )
  // One dated ahead, by a skewed clock, counts as today's, so the days still
  // sum to the totals.
  const commitDays = commits.map(({ time }) =>
    earlierDay(isoDate(Date.parse(time)), today)
  )
  const pullDays = pulls.map(({ time }) =>
    earlierDay(isoDate(Date.parse(time)), today)
  )
  const firstDay = [today, ...commitDays, ...pullDays].reduce(earlierDay)
  const days = listDays(firstDay, today)
  /** How many of `dated` fall on each of the history's days. */
  const countDaily = (dated: string[]) => {
    const counts = countBy(dated, (day) => day)
    return days.map((day) => counts[day] ?? 0)
  }
  return {
    totals: { commits: commits.length, prs: pulls.length },
    history: {
      firstDay,
      lastDay: today,
      commits: countDaily(commitDays),
      prs: countDaily(pullDays),
    },
  }
}

exitIfReusing('account activity', [TOTALS_FILE, HISTORY_FILE])

const WHAT = "the account's commits and PRs"
const STAND_IN = "the projects' own, added up,"

let totals: ActivityTotals | undefined
let history: ActivityHistory | undefined
if (process.env.SKIP_ACCOUNT_ACTIVITY === 'true') {
  console.log('account activity: skipped, as SKIP_ACCOUNT_ACTIVITY asks')
} else if (token === undefined) {
  reportSkipped(WHAT, 'GITHUB_TOKEN is not set', STAND_IN)
} else {
  try {
    const activity = await fetchAccountActivity()
    totals = activity.totals
    history = activity.history
  } catch (error) {
    reportSkipped(WHAT, error, STAND_IN)
  }
}

await writeGenerated(
  TOTALS_FILE,
  'fetch:account-activity',
  "import type { ActivityTotals } from '~/counts'",
  [
    {
      name: 'ACCOUNT_ACTIVITY_TOTALS',
      doc: "The GitHub account's commits, and merged pull requests, in all, in any repo, its own and others'; undefined where they couldn't be fetched.",
      type: 'ActivityTotals | undefined',
      value: totals,
    },
  ]
)
await writeGenerated(
  HISTORY_FILE,
  'fetch:account-activity',
  "import type { ActivityHistory } from '~/counts'",
  [
    {
      name: 'ACCOUNT_ACTIVITY',
      doc: "The GitHub account's commits, and merged pull requests, per day, in any repo; undefined where they couldn't be fetched.",
      type: 'ActivityHistory | undefined',
      value: history,
    },
  ]
)
console.log(
  totals
    ? `account activity: ${totals.commits} commits and ${totals.prs} merged PRs`
    : 'account activity: none fetched'
)
