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
