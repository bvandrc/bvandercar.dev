/**
 * Fetches commits and merged pull requests, in all and day by day, from
 * GitHub: each project repo's, by anyone, for its card's glyphs and charts,
 * and the account's own, in any repo, for the footer's totals and charts.
 *
 * Writes the project repos' totals to src/generated/repo-activity-totals.ts
 * and their daily histories to src/generated/repo-activity.ts, and the
 * account's to src/generated/account-activity-totals.ts and
 * src/generated/account-activity.ts; only the lazily loaded charts import the
 * histories, and all four are gitignored. Reads the repos from the content
 * `pnpm fetch:profile` copied, so run that first. A count it can't fetch is
 * left out with a warning, rather than failing the build, unless
 * `REQUIRE_FETCHED_DATA=true`, as the deploy sets it. With
 * `REUSE_FETCHED_DATA=true`, it keeps the files where they already exist, as
 * a preview build does with recent data it restored from its cache.
 */

import { fetchAccountActivity } from './fetch-git-activity/account.ts'
import { fetchProjectReposActivity } from './fetch-git-activity/project-repos.ts'
import { GENERATED_DIR } from './shared/constants.ts'
import { exitIfReusing, writeGenerated } from './shared/generated.ts'

const REPO_TOTALS_FILE = `${GENERATED_DIR}/repo-activity-totals.ts`
const REPO_HISTORY_FILE = `${GENERATED_DIR}/repo-activity.ts`
const ACCOUNT_TOTALS_FILE = `${GENERATED_DIR}/account-activity-totals.ts`
const ACCOUNT_HISTORY_FILE = `${GENERATED_DIR}/account-activity.ts`

exitIfReusing('git activity', [
  REPO_TOTALS_FILE,
  REPO_HISTORY_FILE,
  ACCOUNT_TOTALS_FILE,
  ACCOUNT_HISTORY_FILE,
])

// Apart, since search's rate limit is its own.
const [repos, account] = await Promise.all([
  fetchProjectReposActivity(),
  fetchAccountActivity(),
])

const TOTALS_IMPORT = "import type { ActivityTotals } from '~/counts'"
const HISTORY_IMPORT = "import type { ActivityHistory } from '~/counts'"
await writeGenerated(REPO_TOTALS_FILE, 'fetch:git-activity', TOTALS_IMPORT, [
  {
    name: 'REPO_ACTIVITY_TOTALS',
    doc: "Each project repo's commits on its default branch, and merged pull requests, in all, keyed by repo name.",
    type: 'Record<string, ActivityTotals | undefined>',
    value: repos.totals,
  },
])
await writeGenerated(REPO_HISTORY_FILE, 'fetch:git-activity', HISTORY_IMPORT, [
  {
    name: 'REPO_ACTIVITY',
    doc: "Each project repo's commits, and merged pull requests, per day, keyed by repo name.",
    type: 'Record<string, ActivityHistory | undefined>',
    value: repos.histories,
  },
])
await writeGenerated(ACCOUNT_TOTALS_FILE, 'fetch:git-activity', TOTALS_IMPORT, [
  {
    name: 'ACCOUNT_ACTIVITY_TOTALS',
    doc: "The GitHub account's commits, and merged pull requests, in all, in any repo, its own and others'; undefined where they couldn't be fetched.",
    type: 'ActivityTotals | undefined',
    value: account?.totals,
  },
])
await writeGenerated(
  ACCOUNT_HISTORY_FILE,
  'fetch:git-activity',
  HISTORY_IMPORT,
  [
    {
      name: 'ACCOUNT_ACTIVITY',
      doc: "The GitHub account's commits, and merged pull requests, per day, in any repo; undefined where they couldn't be fetched.",
      type: 'ActivityHistory | undefined',
      value: account?.history,
    },
  ]
)
console.log(
  `git activity: totals and daily history for ${Object.keys(repos.totals).length} of ${repos.repoCount} repos, and ${
    account
      ? `the account's ${account.totals.commits} commits and ${account.totals.prs} merged PRs`
      : 'none for the account'
  }`
)
