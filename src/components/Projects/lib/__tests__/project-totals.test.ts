import type { PACKAGE_DOWNLOAD_TOTALS } from '@/generated/package-download-totals'
import type {
  Project,
  ProjectSection,
} from '@/generated/profile/content/projects'
import type { REPO_COUNTS } from '@/generated/profile/repo-counts'
import type { REPO_ACTIVITY_TOTALS } from '@/generated/repo-activity-totals'
import type { ActivityTotals } from '~/counts'

// Hoisted with the mocks below, which run before the file's other top-level code.
const FIXTURES = vi.hoisted(() => ({
  NPM_REPO: 'npm-repo',
  PYPI_REPO: 'pypi-repo',
  SITE_REPO: 'site-repo',
  PROFILE_ONLY_REPO: 'profile-only-repo',
  UNFETCHED_PACKAGE_REPO: 'unfetched-package-repo',
  NPM_PACKAGE: 'some-package',
  PYPI_PACKAGE: 'some-python-package',
  UNFETCHED_PACKAGE: 'unfetched-package',
}))
const {
  NPM_REPO,
  PYPI_REPO,
  SITE_REPO,
  PROFILE_ONLY_REPO,
  UNFETCHED_PACKAGE_REPO,
  NPM_PACKAGE,
  PYPI_PACKAGE,
  UNFETCHED_PACKAGE,
} = FIXTURES

vi.mock('@/generated/profile/repo-counts', () => ({
  // Older than this site's fetches, which differ from them as they would.
  REPO_COUNTS: {
    [FIXTURES.NPM_REPO]: { commits: 25, prs: 10, downloads: 1000 },
    [FIXTURES.PYPI_REPO]: { commits: 8, prs: 1, downloads: 250 },
    [FIXTURES.SITE_REPO]: { commits: 30, prs: 20 },
    [FIXTURES.PROFILE_ONLY_REPO]: { commits: 7, prs: 3 },
    [FIXTURES.UNFETCHED_PACKAGE_REPO]: {
      commits: 4,
      prs: 4,
      downloads: 500,
    },
  } satisfies typeof REPO_COUNTS,
}))

vi.mock('@/generated/repo-activity-totals', () => ({
  REPO_ACTIVITY_TOTALS: {
    [FIXTURES.NPM_REPO]: { commits: 55, prs: 14 },
    [FIXTURES.PYPI_REPO]: { commits: 10, prs: 2 },
    [FIXTURES.SITE_REPO]: { commits: 40, prs: 30 },
    [FIXTURES.UNFETCHED_PACKAGE_REPO]: { commits: 5, prs: 5 },
  } satisfies typeof REPO_ACTIVITY_TOTALS,
}))

vi.mock('@/generated/package-download-totals', () => ({
  PACKAGE_DOWNLOAD_TOTALS: {
    npm: { [FIXTURES.NPM_PACKAGE]: 1217 },
    pypi: { [FIXTURES.PYPI_PACKAGE]: 300 },
  } satisfies typeof PACKAGE_DOWNLOAD_TOTALS,
}))

// The account's own commits and PRs, unfetched unless a case mocks them.
vi.mock('@/generated/account-activity-totals', () => ({
  ACCOUNT_ACTIVITY_TOTALS: undefined,
}))

/** Mocks the account's own commits and PRs, in every repo, for the rest of the case. */
const mockAccountTotals = (totals: ActivityTotals) => {
  vi.doMock('@/generated/account-activity-totals', () => ({
    ACCOUNT_ACTIVITY_TOTALS: totals,
  }))
  onTestFinished(() => {
    vi.doMock('@/generated/account-activity-totals', () => ({
      ACCOUNT_ACTIVITY_TOTALS: undefined,
    }))
  })
}

/** A project for `repo`, publishing any of `packages`. */
const buildProject = (
  repo: string,
  packages?: Pick<Project, 'npmPackage' | 'pypiPackage'>
) =>
  ({
    name: repo,
    href: `https://example.com/${repo}`,
    type: 'react',
    repo,
    blurb: `About ${repo}.`,
    ...packages,
  }) satisfies Project

// Each fetched in full by this site.
const FETCHED_PROJECTS = [
  buildProject(NPM_REPO, { npmPackage: NPM_PACKAGE }),
  buildProject(PYPI_REPO, { pypiPackage: PYPI_PACKAGE }),
  buildProject(SITE_REPO),
]

/** Adds up the counts of the projects in `groups`, each a group on the page. */
const getProjectTotals = async (...groups: Project[][]) => {
  // A fresh copy, reading these groups as the page's projects.
  vi.resetModules()
  vi.doMock('@/generated/profile/content/projects', async (importOriginal) => ({
    ...(await importOriginal()),
    PROJECTS: groups.map(
      (projects, index) =>
        ({
          icon: { slug: 'react', color: '61DAFB' },
          title: `Group ${index}`,
          projects,
        }) satisfies ProjectSection
    ),
  }))
  onTestFinished(() => vi.doUnmock('@/generated/profile/content/projects'))
  const { getProjectTotals: getFreshTotals } = await import('../project-totals')
  return getFreshTotals()
}

describe('getProjectTotals', () => {
  it("adds up each kind of count across the projects, in the glyphs' order, counting a repo in two groups once", async () => {
    const totals = await getProjectTotals(FETCHED_PROJECTS, [
      buildProject(SITE_REPO),
    ])

    expect(totals.shown).toEqual([
      expect.objectContaining({ key: 'commits', noun: 'commit', count: 105 }),
      // Every project's, though none has enough for its own glyphs to show.
      expect.objectContaining({ key: 'prs', noun: 'PR', count: 46 }),
      expect.objectContaining({ key: 'downloads', count: 1517 }),
    ])
  })

  it('charts every repo and package where this site fetched all their counts', async () => {
    expect(await getProjectTotals(FETCHED_PROJECTS)).toMatchObject({
      repos: [NPM_REPO, PYPI_REPO, SITE_REPO],
      packages: [
        { registry: 'npm', name: NPM_PACKAGE },
        { registry: 'pypi', name: PYPI_PACKAGE },
      ],
      // Commits, PRs, and downloads.
      chartCount: 3,
    })
  })

  it("charts no commits or PRs where any repo's are the profile's alone, though it still counts them", async () => {
    const totals = await getProjectTotals([
      ...FETCHED_PROJECTS,
      buildProject(PROFILE_ONLY_REPO),
    ])

    expect(totals).toMatchObject({
      shown: [
        expect.objectContaining({ key: 'commits', count: 112 }),
        expect.objectContaining({ key: 'prs', count: 49 }),
        expect.objectContaining({ key: 'downloads' }),
      ],
      repos: [],
      chartCount: 1,
    })
  })

  it("charts no downloads where any project's are the profile's alone, though it still counts them", async () => {
    const totals = await getProjectTotals([
      ...FETCHED_PROJECTS,
      buildProject(UNFETCHED_PACKAGE_REPO, { npmPackage: UNFETCHED_PACKAGE }),
    ])

    expect(totals).toMatchObject({
      shown: [
        expect.objectContaining({ key: 'commits' }),
        expect.objectContaining({ key: 'prs' }),
        expect.objectContaining({ key: 'downloads', count: 2017 }),
      ],
      packages: [],
      chartCount: 2,
    })
  })

  it("counts the account's own commits and PRs, in every repo, in place of the projects', where fetched, and charts them", async () => {
    mockAccountTotals({ commits: 2600, prs: 1573 })
    // One repo's counts the profile's alone, which would leave the projects'
    // uncharted.
    const totals = await getProjectTotals([
      ...FETCHED_PROJECTS,
      buildProject(PROFILE_ONLY_REPO),
    ])

    expect(totals).toMatchObject({
      shown: [
        expect.objectContaining({ key: 'commits', count: 2600 }),
        expect.objectContaining({ key: 'prs', count: 1573 }),
        // Still the projects' packages', added up.
        expect.objectContaining({ key: 'downloads', count: 1517 }),
      ],
      chartCount: 3,
    })
  })

  it('leaves out downloads, and their chart, where no project has any', async () => {
    const totals = await getProjectTotals([buildProject(SITE_REPO)])

    expect(totals.shown.map(({ key }) => key)).toEqual(['commits', 'prs'])
    expect(totals).toMatchObject({ packages: [], chartCount: 2 })
  })
})
