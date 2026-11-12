/**
 * Fetches each project repo's commits and merged pull requests from GitHub,
 * by anyone, in all and day by day, for its card's glyphs and charts, and the
 * footer's charts of every project's together.
 *
 * Writes the totals to src/generated/repo-activity-totals.ts, and the daily
 * histories to src/generated/repo-activity.ts, which only the lazily loaded
 * charts import, for the same repos; both gitignored. Reads the repos from
 * the content `pnpm fetch:profile` copied, so run that first. A count it
 * can't fetch is left out with a warning, rather than failing the build,
 * unless `REQUIRE_FETCHED_DATA=true`, as the deploy sets it. With
 * `REUSE_FETCHED_DATA=true`, it keeps the files where they already exist, as
 * a preview build does with recent data it restored from its cache.
 */

import { fetchProjectReposActivity } from './fetch-git-activity/project-repos.ts'
import { GENERATED_DIR } from './shared/constants.ts'
import { exitIfReusing, writeGenerated } from './shared/generated.ts'

const REPO_TOTALS_FILE = `${GENERATED_DIR}/repo-activity-totals.ts`
const REPO_HISTORY_FILE = `${GENERATED_DIR}/repo-activity.ts`

exitIfReusing('git activity', [REPO_TOTALS_FILE, REPO_HISTORY_FILE])

const repos = await fetchProjectReposActivity()

await writeGenerated(
  REPO_TOTALS_FILE,
  'fetch:git-activity',
  "import type { ActivityTotals } from '~/counts'",
  [
    {
      name: 'REPO_ACTIVITY_TOTALS',
      doc: "Each project repo's commits on its default branch, and merged pull requests, in all, keyed by repo name.",
      type: 'Record<string, ActivityTotals | undefined>',
      value: repos.totals,
    },
  ]
)
await writeGenerated(
  REPO_HISTORY_FILE,
  'fetch:git-activity',
  "import type { ActivityHistory } from '~/counts'",
  [
    {
      name: 'REPO_ACTIVITY',
      doc: "Each project repo's commits, and merged pull requests, per day, keyed by repo name.",
      type: 'Record<string, ActivityHistory | undefined>',
      value: repos.histories,
    },
  ]
)
console.log(
  `git activity: totals and daily history for ${Object.keys(repos.totals).length} of ${repos.repoCount} repos`
)
