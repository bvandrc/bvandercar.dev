import type {
  PACKAGE_DOWNLOADS,
  PACKAGE_RELEASES,
} from '@/generated/package-downloads'
import type { REPO_ACTIVITY } from '@/generated/repo-activity'
import { getProjectCharts, type ProjectPackage } from '../project-charts'

// Hoisted with the mocks below, which run before the file's other top-level code.
const FIXTURES = vi.hoisted(() => ({
  REPO: 'some-repo',
  SMALL_REPO: 'small-repo',
  NEW_REPO: 'new-repo',
  NPM_PACKAGE: 'some-package',
  FRESH_PACKAGE: 'fresh-package',
  UNRELEASED_PACKAGE: 'unreleased-package',
  ONE_DAY_PACKAGE: 'one-day-package',
  // Each day's downloads from Mar 4 to 24.
  DAILY_DOWNLOADS: [
    1, 1, 1, 1, 1, 0, 0, 200, 300, 100, 200, 100, 200, 100, 2, 2, 2, 2, 2, 1, 1,
  ],
}))
const {
  REPO,
  SMALL_REPO,
  NEW_REPO,
  NPM_PACKAGE,
  FRESH_PACKAGE,
  UNRELEASED_PACKAGE,
  ONE_DAY_PACKAGE,
} = FIXTURES

vi.mock('@/generated/repo-activity', () => ({
  REPO_ACTIVITY: {
    // 3, 40, then 12 commits a week from Monday, Feb 23, then quiet to Mar
    // 26: 14 by Mar 2, and 15 by Mar 3.
    [FIXTURES.REPO]: {
      firstDay: '2026-02-23',
      lastDay: '2026-03-26',
      commits: [
        1, 0, 0, 1, 0, 1, 0, 11, 1, 4, 5, 10, 5, 4, 3, 4, 0, 5, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
    // 12 commits over 15 days: over two weeks, but fewer than 20 commits.
    [FIXTURES.SMALL_REPO]: {
      firstDay: '2026-03-02',
      lastDay: '2026-03-16',
      commits: [1, 1, 1, 1, 1, 0, 0, 2, 2, 2, 1, 0, 0, 0, 0],
    },
    // A single day.
    [FIXTURES.NEW_REPO]: {
      firstDay: '2026-03-18',
      lastDay: '2026-03-18',
      commits: [2],
    },
  } satisfies typeof REPO_ACTIVITY,
}))

vi.mock('@/generated/package-downloads', () => ({
  PACKAGE_DOWNLOADS: {
    npm: {
      [FIXTURES.NPM_PACKAGE]: {
        firstDay: '2026-03-04',
        lastDay: '2026-03-24',
        daily: FIXTURES.DAILY_DOWNLOADS,
      },
      [FIXTURES.FRESH_PACKAGE]: {
        firstDay: '2026-03-20',
        lastDay: '2026-03-24',
        daily: [10, 5, 5, 5, 5],
      },
      [FIXTURES.UNRELEASED_PACKAGE]: {
        firstDay: '2026-03-04',
        lastDay: '2026-03-24',
        daily: FIXTURES.DAILY_DOWNLOADS,
      },
      // With no releases, so its charts start at its repo's first day.
      [FIXTURES.ONE_DAY_PACKAGE]: {
        firstDay: '2026-03-24',
        lastDay: '2026-03-24',
        daily: [3],
      },
    },
    pypi: {},
  } satisfies typeof PACKAGE_DOWNLOADS,
  PACKAGE_RELEASES: {
    npm: {
      [FIXTURES.NPM_PACKAGE]: [
        { version: '1.0.0', day: '2026-03-04' },
        { version: '1.1.0', day: '2026-03-12' },
      ],
      // First released four days before its repo's history ends.
      [FIXTURES.FRESH_PACKAGE]: [{ version: '1.0.0', day: '2026-03-20' }],
    },
    pypi: {},
  } satisfies typeof PACKAGE_RELEASES,
}))

/** The npm package named `name`, as a project gives it. */
const buildNpmPackage = (name: string) =>
  ({ registry: 'npm', name }) satisfies ProjectPackage

describe('getProjectCharts', () => {
  it("charts a repo's commits and its package's downloads from its first release, to the later of their last days", () => {
    expect(getProjectCharts(REPO, buildNpmPackage(NPM_PACKAGE))).toMatchObject({
      activity: { firstDay: '2026-02-23' },
      downloads: { registry: 'npm', history: { firstDay: '2026-03-04' } },
      releases: [{ day: '2026-03-04' }, { day: '2026-03-12' }],
      // Not the repo's first commit, Feb 23, nor the downloads' last day.
      span: { start: '2026-03-04', end: '2026-03-26' },
      descriptions: [
        'Weekly commits since Feb 2026, peaking at 40 in the week of Mar 2, 2026',
        'Weekly npm downloads since Mar 2026, peaking at 1,200 in the week of Mar 11, 2026',
      ],
    })
  })

  it('starts a repo with no package on the day its commits reach 15', () => {
    expect(getProjectCharts(REPO, undefined)?.span.start).toBe('2026-03-03')
  })

  it('starts a package with no releases on the first day either counts', () => {
    expect(
      getProjectCharts(REPO, buildNpmPackage(UNRELEASED_PACKAGE))?.span.start
    ).toBe('2026-02-23')
  })

  it('charts a repo with fewer than 20 commits only if it publishes a package', () => {
    expect(getProjectCharts(SMALL_REPO, undefined)).toBeUndefined()
    expect(
      getProjectCharts(SMALL_REPO, buildNpmPackage(NPM_PACKAGE))?.activity
    ).toMatchObject({ firstDay: '2026-03-02' })
  })

  it('charts nothing across under two weeks, like a package released this week, however long its repo', () => {
    expect(
      getProjectCharts(REPO, buildNpmPackage(FRESH_PACKAGE))
    ).toBeUndefined()
  })

  it('charts neither history from a single day, though the other', () => {
    expect(
      getProjectCharts(NEW_REPO, buildNpmPackage(NPM_PACKAGE))
    ).toMatchObject({ activity: undefined, downloads: { registry: 'npm' } })
    expect(
      getProjectCharts(REPO, buildNpmPackage(ONE_DAY_PACKAGE))
    ).toMatchObject({
      activity: { firstDay: '2026-02-23' },
      downloads: undefined,
    })
  })

  it('charts nothing from a single day, or from no history at all', () => {
    const CASES = [
      [NEW_REPO, undefined],
      ['unfetched-repo', buildNpmPackage('unfetched-package')],
    ] as const
    for (const [repo, pkg] of CASES) {
      expect(getProjectCharts(repo, pkg), repo).toBeUndefined()
    }
  })
})
