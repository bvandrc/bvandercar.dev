import { isNotNil, uniq } from 'es-toolkit'
import { objectEntries } from 'ts-extras'

import {
  PROJECTS,
  type Project,
} from '../../src/generated/profile/content/projects.ts'
import { REPO_COUNTS } from '../../src/generated/profile/repo-counts.ts'

/** A project field naming what its counts are fetched for. */
type CountsSource = 'repo' | 'npmPackage' | 'pypiPackage'

/** A count the profile and this site's fetches both give. */
type CountKey = 'commits' | 'prs' | 'downloads'

const ALL_PROJECTS: Project[] = PROJECTS.flatMap(({ projects }) => projects)

/**
 * Every value the projects give for `field`, like each `repo`, sorted and
 * without repeats.
 *
 * Read from the content `pnpm fetch:profile` copied, so run that first.
 */
export const getProjectValues = (field: CountsSource) =>
  uniq(ALL_PROJECTS.flatMap((project) => project[field] ?? [])).sort()

/** The repo of the project published as `pkg` under `field`. */
export const getPackageRepo = (
  field: 'npmPackage' | 'pypiPackage',
  pkg: string
) => ALL_PROJECTS.find((project) => project[field] === pkg)?.repo

/**
 * Why `counts`, fetched for `repo`, can't be right: any of them fewer than the
 * profile's, which is older, so they can only have grown since. Undefined
 * where none is.
 */
export const findShortfall = (
  repo: string | undefined,
  counts: Partial<Record<CountKey, number>>
) => {
  const profile = repo === undefined ? undefined : REPO_COUNTS[repo]
  const shortfalls = objectEntries(counts).flatMap(([key, count]) => {
    const profileCount = profile?.[key]
    return isNotNil(count) && isNotNil(profileCount) && count < profileCount
      ? [`${count} ${key}, fewer than the profile's ${profileCount}`]
      : []
  })
  return shortfalls.length > 0 ? shortfalls.join(', and ') : undefined
}
