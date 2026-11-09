import type { Project } from '../src/generated/profile/content/projects.ts'

/** The fields of a project its counts are fetched and read for: its repo's, and its package's. */
export const COUNTS_FIELDS = [
  'repo',
  'npmPackage',
  'pypiPackage',
] as const satisfies (keyof Project)[]

export type CountsField = (typeof COUNTS_FIELDS)[number]

/** A package registry whose downloads are counted. */
export type Registry = 'npm' | 'pypi'

/** The project field naming its package on each registry. */
export const PACKAGE_FIELDS = {
  npm: 'npmPackage',
  pypi: 'pypiPackage',
} as const satisfies Record<Registry, CountsField>

/** A repo's commits on its default branch, and its pull requests, in all. */
export type ActivityTotals = { commits: number; prs: number }

/** A repo's commits per day. */
export type CommitHistory = {
  /** ISO date of the repo's first commit or pull request */
  firstDay: string
  /** ISO date the history was read */
  lastDay: string
  /** Commits on the default branch each day from `firstDay` through `lastDay`, oldest first; they sum to the repo's total */
  commits: number[]
}

/** A package's downloads per day since its first publish. */
export type DownloadHistory = {
  /** ISO date of the first day counted, the package's first publish */
  firstDay: string
  /** ISO date of the last day counted */
  lastDay: string
  /** Downloads on each day from `firstDay` through `lastDay`, oldest first */
  daily: number[]
}

/** A package's release: its version, and the ISO date it was published. */
export type Release = { version: string; day: string }
