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

/** A repo's commits and pull requests per week. */
export type WeeklyActivity = {
  /** ISO date of the Monday the first week starts on */
  firstWeek: string
  /** ISO date the history was read, which ends the last week, the one under way */
  lastDay: string
  /** Commits on the default branch in each week, oldest first; they sum to the repo's total */
  commits: number[]
  /** Pull requests opened in each of the same weeks */
  prs: number[]
}

/** A package's downloads per week since its first publish. */
export type WeeklyDownloads = {
  /** ISO date of the first day counted, the package's first publish */
  firstDay: string
  /** ISO date of the last day counted, the end of the last week */
  lastDay: string
  /** Downloads in each 7-day week ending on `lastDay`, oldest first; the first can be shorter */
  weekly: number[]
}

/** A package's release: its version, and the ISO date it was published. */
export type Release = { version: string; day: string }
