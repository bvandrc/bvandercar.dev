import type { PACKAGE_DOWNLOADS } from '@/generated/package-downloads'
import type { REPO_ACTIVITY } from '@/generated/repo-activity'
import type { ProjectPackage } from '../project-charts'
import { getTotalCharts } from '../total-charts'

// Hoisted with the mocks below, which run before the file's other top-level code.
const FIXTURES = vi.hoisted(() => ({
  REPO: 'some-repo',
  LATER_REPO: 'later-repo',
  ONE_DAY_REPO: 'one-day-repo',
  OLD_REPO: 'old-repo',
  LONG_REPO: 'long-repo',
  NPM_PACKAGE: 'some-package',
  PYPI_PACKAGE: 'some-python-package',
}))
const {
  REPO,
  LATER_REPO,
  ONE_DAY_REPO,
  OLD_REPO,
  LONG_REPO,
  NPM_PACKAGE,
  PYPI_PACKAGE,
} = FIXTURES

vi.mock('@/generated/repo-activity', () => ({
  REPO_ACTIVITY: {
    // A commit a day for 19 days from Mar 2, with no PRs.
    [FIXTURES.REPO]: {
      firstDay: '2026-03-02',
      lastDay: '2026-03-20',
      commits: Array.from({ length: 19 }, () => 1),
      prs: Array.from({ length: 19 }, () => 0),
    },
    // Two commits and a PR a day for its last 11 of those days.
    [FIXTURES.LATER_REPO]: {
      firstDay: '2026-03-10',
      lastDay: '2026-03-20',
      commits: Array.from({ length: 11 }, () => 2),
      prs: Array.from({ length: 11 }, () => 1),
    },
    // A commit a day for 32 days from Dec 20, 2024, into 2025.
    [FIXTURES.OLD_REPO]: {
      firstDay: '2024-12-20',
      lastDay: '2025-01-20',
      commits: Array.from({ length: 32 }, () => 1),
      prs: Array.from({ length: 32 }, () => 0),
    },
    // A commit a day from Jun 1, 2024 to Nov 10, 2026: far longer than 18
    // months.
    [FIXTURES.LONG_REPO]: {
      firstDay: '2024-06-01',
      lastDay: '2026-11-10',
      commits: Array.from({ length: 893 }, () => 1),
      prs: Array.from({ length: 893 }, () => 0),
    },
    [FIXTURES.ONE_DAY_REPO]: {
      firstDay: '2026-03-20',
      lastDay: '2026-03-20',
      commits: [3],
      prs: [1],
    },
  } satisfies typeof REPO_ACTIVITY,
}))

vi.mock('@/generated/package-downloads', () => ({
  PACKAGE_DOWNLOADS: {
    // A download a day for 15 days from Mar 5.
    npm: {
      [FIXTURES.NPM_PACKAGE]: {
        firstDay: '2026-03-05',
        lastDay: '2026-03-19',
        daily: Array.from({ length: 15 }, () => 1),
      },
    },
    // Ten a day for 11 days from Mar 8.
    pypi: {
      [FIXTURES.PYPI_PACKAGE]: {
        firstDay: '2026-03-08',
        lastDay: '2026-03-18',
        daily: Array.from({ length: 11 }, () => 10),
      },
    },
  } satisfies typeof PACKAGE_DOWNLOADS,
  PACKAGE_RELEASES: { npm: {}, pypi: {} },
}))

const PACKAGES = [
  { registry: 'npm', name: NPM_PACKAGE },
  { registry: 'pypi', name: PYPI_PACKAGE },
] satisfies ProjectPackage[]

/** `count` repeated `days` times, a stretch of a daily history. */
const buildDays = (days: number, count: number) =>
  Array.from({ length: days }, () => count)

describe('getTotalCharts', () => {
  it("adds up the repos' commits and merged PRs day by day, from the first day any counts, charting both", () => {
    const charts = getTotalCharts([REPO, LATER_REPO], [])

    const ACTIVITY = {
      firstDay: '2026-03-02',
      lastDay: '2026-03-20',
      // The later repo's join in from Mar 10.
      commits: [...buildDays(8, 1), ...buildDays(11, 3)],
      prs: [...buildDays(8, 0), ...buildDays(11, 1)],
    }
    expect(charts).toMatchObject({
      activity: ACTIVITY,
      prs: ACTIVITY,
      downloads: undefined,
    })
  })

  it("adds up the packages' downloads day by day across registries, naming none", () => {
    expect(getTotalCharts([], PACKAGES)?.downloads).toEqual({
      history: {
        firstDay: '2026-03-05',
        lastDay: '2026-03-19',
        // PyPI's join in from Mar 8, through Mar 18.
        daily: [...buildDays(3, 1), ...buildDays(11, 11), 1],
      },
    })
  })

  it('spans every chart from the earliest first day to the latest last one, marking no releases, and describes each', () => {
    expect(getTotalCharts([REPO, LATER_REPO], PACKAGES)).toMatchObject({
      span: { start: '2026-03-02', end: '2026-03-20' },
      // Under 18 months, so they open zoomed all the way out.
      initialSpan: undefined,
      releases: undefined,
      // Each chart's, in its order.
      descriptions: [
        expect.stringMatching(/^Weekly commits /),
        expect.stringMatching(/^Weekly PRs /),
        expect.stringMatching(/^Weekly downloads /),
      ],
    })
  })

  it('starts the charts no earlier than Jan 1, 2025, charting the whole history all the same', () => {
    expect(getTotalCharts([OLD_REPO], [])).toMatchObject({
      span: { start: '2025-01-01', end: '2025-01-20' },
      // Its days before then still count toward where the line starts.
      activity: { firstDay: '2024-12-20' },
    })
  })

  it('opens charts spanning over 18 months zoomed in on their last 18', () => {
    expect(getTotalCharts([LONG_REPO], [])).toMatchObject({
      span: { start: '2025-01-01', end: '2026-11-10' },
      initialSpan: { start: '2025-05-10', end: '2026-11-10' },
    })
  })

  it('charts no history from a single day, though the other', () => {
    expect(getTotalCharts([ONE_DAY_REPO], PACKAGES)).toMatchObject({
      activity: undefined,
      prs: undefined,
      downloads: { history: { firstDay: '2026-03-05' } },
    })
  })

  it('charts nothing across under two weeks, or from no history at all', () => {
    const CASES = [
      // 11 days.
      [[LATER_REPO], []],
      [[], []],
      [['unfetched-repo'], [{ registry: 'npm', name: 'unfetched-package' }]],
    ] satisfies [string[], ProjectPackage[]][]
    for (const [repos, packages] of CASES) {
      expect(getTotalCharts(repos, packages), repos.join()).toBeUndefined()
    }
  })
})
