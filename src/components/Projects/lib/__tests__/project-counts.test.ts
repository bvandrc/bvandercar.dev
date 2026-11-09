import type { PACKAGE_DOWNLOAD_TOTALS } from '@/generated/package-download-totals'
import type { REPO_COUNTS } from '@/generated/profile/repo-counts'
import type { REPO_ACTIVITY_TOTALS } from '@/generated/repo-activity-totals'
import { getProjectCounts } from '../project-counts'

// Hoisted with the mocks below, which run before the file's other top-level code.
const FIXTURES = vi.hoisted(() => ({
  REPO: 'some-repo',
  PROFILE_ONLY_REPO: 'profile-only-repo',
  NPM_PACKAGE: 'some-package',
  PYPI_PACKAGE: 'some-python-package',
}))
const { REPO, PROFILE_ONLY_REPO, NPM_PACKAGE, PYPI_PACKAGE } = FIXTURES

vi.mock('@/generated/profile/repo-counts', () => ({
  // Older than this site's fetches, which differ from them as they would.
  REPO_COUNTS: {
    [FIXTURES.REPO]: { commits: 25, prs: 31, downloads: 3120 },
    [FIXTURES.PROFILE_ONLY_REPO]: { commits: 7, prs: 3 },
  } satisfies typeof REPO_COUNTS,
}))

vi.mock('@/generated/repo-activity-totals', () => ({
  REPO_ACTIVITY_TOTALS: {
    [FIXTURES.REPO]: { commits: 55, prs: 14 },
  } satisfies typeof REPO_ACTIVITY_TOTALS,
}))

vi.mock('@/generated/package-download-totals', () => ({
  PACKAGE_DOWNLOAD_TOTALS: {
    npm: { [FIXTURES.NPM_PACKAGE]: 1217 },
    pypi: {},
  } satisfies typeof PACKAGE_DOWNLOAD_TOTALS,
}))

describe('getProjectCounts', () => {
  it("counts with this site's own fetches where it has them, with a chart for each", () => {
    expect(getProjectCounts({ repo: REPO, npmPackage: NPM_PACKAGE })).toEqual({
      counts: { commits: 55, prs: 14, downloads: 1217 },
      pkg: { registry: 'npm', name: NPM_PACKAGE },
      chartCount: 2,
    })
  })

  it("keeps the profile's counts where this site fetched none, with nothing to chart", () => {
    expect(
      getProjectCounts({ repo: PROFILE_ONLY_REPO, pypiPackage: PYPI_PACKAGE })
    ).toEqual({
      counts: { commits: 7, prs: 3 },
      pkg: { registry: 'pypi', name: PYPI_PACKAGE },
      chartCount: 0,
    })
  })
})
