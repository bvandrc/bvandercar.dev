/**
 * The account's side of `pnpm fetch:git-activity`: every commit and merged
 * pull request the GitHub account made, in any repo, its own and others', in
 * all and day by day, for the footer's totals and their charts.
 *
 * Commits come from GitHub's commit search, which reads every repo's default
 * branch but no fork's, so each of the account's public forks is read branch
 * by branch too, for the work it never merged anywhere. A commit found more
 * than once, as in a fork of a repo it landed in, counts once. Pull requests
 * come from GitHub's issue search, each on the day it merged. Search reads a
 * private repo only where `GITHUB_TOKEN` can.
 */

import { setTimeout } from 'node:timers/promises'
import { uniqBy } from 'es-toolkit'
import { objectKeys } from 'ts-extras'

import type { ActivityKind, ActivityTotals } from '../../shared/counts.ts'
import { addDays, getDaysBetween, isoDate } from '../../shared/dates.ts'
import { GITHUB_OWNER } from '../../shared/github.ts'
import { octokit, token } from '../shared/octokit.ts'
import { readPublished, writePublished } from '../shared/published.ts'
import { reportSkipped } from '../shared/skipped.ts'
import { buildActivityHistory, toDay } from './history.ts'

// The most results GitHub's search gives for one query, past which a query
// is split into shorter stretches of dates.
const SEARCH_MAX_RESULTS = 1000
// The most results a search gives a page.
const SEARCH_PAGE_SIZE = 100
// How many times a page that search gave up early on is asked for, and how
// long to wait before the first retry, longer before each after.
const SEARCH_ATTEMPTS = 3
const SEARCH_RETRY_MS = 2000
// The account's totals, as the deploy publishes them, for the next build's
// floor.
const PUBLISHED_FILE = 'account-activity.json'
// What each count is called, as written in a sentence.
const KIND_NAMES = {
  commits: 'commits',
  prs: 'PRs',
} as const satisfies Record<ActivityKind, string>
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

/** The `page`th page of what `search` finds for `q`, asked again where search gave up before finding them all, and failing where it keeps doing so. */
const getCompletePage = async (
  search: DatedSearch,
  q: string,
  page: number
) => {
  for (let attempt = 1; attempt <= SEARCH_ATTEMPTS; attempt++) {
    const result = await search.getPage(q, page)
    if (!result.incomplete) {
      return result
    }
    // A search that runs out of time on one try usually finishes on the next.
    await setTimeout(SEARCH_RETRY_MS * attempt)
  }
  throw new Error(
    `GitHub's search gave up early on "${q}", ${SEARCH_ATTEMPTS} times`
  )
}

/**
 * Every result of `search`, at any date, failing where searching it date by
 * date gives back fewer than it finds in all, rather than undercount.
 *
 * Where a result is indexed partway through, it can give back more.
 */
const searchAll = async (search: DatedSearch, today: string) => {
  // Counted first, so one indexed while the dates are searched only adds.
  const { total } = await getCompletePage(search, search.query, 1)
  const results = await searchDated(search, SEARCH_START, today)
  if (results.length < total) {
    throw new Error(
      `"${search.query}" finds ${total} in all, but gave back ${results.length} searched by dates`
    )
  }
  return results
}

/**
 * Every result of `search` dated from `from` through `to`, ISO dates.
 *
 * Splits the dates in two wherever they hold more than search gives, and
 * fails where search keeps giving up early, rather than undercount.
 */
const searchDated = async (
  search: DatedSearch,
  from: string,
  to: string
): Promise<Dated[]> => {
  const q = `${search.query} ${search.qualifier}:${from}..${to}`
  /** The `page`th page of what `q` finds. */
  const getPage = (page: number) => getCompletePage(search, q, page)
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
const fetchActivity = async () => {
  const today = isoDate(Date.now())
  const commits = uniqBy(
    [...(await searchAll(COMMIT_SEARCH, today)), ...(await fetchForkCommits())],
    ({ id }) => id
  )
  const pulls = uniqBy(await searchAll(PULL_SEARCH, today), ({ id }) => id)
  return {
    totals: { commits: commits.length, prs: pulls.length },
    history: buildActivityHistory(
      {
        commitDays: commits.map(({ time }) => toDay(time, today)),
        prDays: pulls.map(({ time }) => toDay(time, today)),
      },
      today
    ),
  }
}

/**
 * Why `totals` can't be right: any of them fewer than the live site
 * published, as the last deploy fetched them, since they can only have grown
 * since. Undefined where none is, or the live site published none.
 */
const findShortfall = async (totals: ActivityTotals) => {
  const published = await readPublished<ActivityTotals>(
    'git activity',
    PUBLISHED_FILE
  )
  const short = objectKeys(totals).filter((kind) => {
    const floor = published[kind]
    return floor !== undefined && totals[kind] < floor
  })
  return short.length === 0
    ? undefined
    : `fewer ${short.map((kind) => KIND_NAMES[kind]).join(' and ')} than the ${short.map((kind) => published[kind]).join(' and ')} the live site has, so the fetch must have missed some`
}

/**
 * The account's commits and merged pull requests, in all and by day, or
 * undefined where they weren't fetched.
 *
 * Without a token, where a request fails, or where they're fewer than the
 * live site has, it reports them left out, so the projects' own, added up,
 * stand in; `ALLOW_ACCOUNT_ACTIVITY_DROP=true` lets them be fewer, as where a
 * repo was deleted. It writes the totals it fetched for the deploy to publish,
 * as the next build's floor. With `SKIP_ACCOUNT_ACTIVITY=true`, it asks
 * GitHub nothing.
 */
export const fetchAccountActivity = async () => {
  const what = "the account's commits and PRs"
  const standIn = "the projects' own, added up,"
  if (process.env.SKIP_ACCOUNT_ACTIVITY === 'true') {
    console.log(
      'git activity: skipped the account, as SKIP_ACCOUNT_ACTIVITY asks'
    )
    return undefined
  }
  if (token === undefined) {
    reportSkipped(what, 'GITHUB_TOKEN is not set', standIn)
    return undefined
  }
  try {
    const activity = await fetchActivity()
    const shortfall = await findShortfall(activity.totals)
    if (shortfall && process.env.ALLOW_ACCOUNT_ACTIVITY_DROP !== 'true') {
      reportSkipped(what, shortfall, standIn)
      return undefined
    }
    await writePublished(PUBLISHED_FILE, activity.totals)
    return activity
  } catch (error) {
    reportSkipped(what, error, standIn)
    return undefined
  }
}
