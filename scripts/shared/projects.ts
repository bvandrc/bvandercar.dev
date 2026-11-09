import { readFile } from 'node:fs/promises'

import { PROJECTS_FILE } from './constants.ts'

/**
 * Every value the projects give for `field`, like each `repo`, sorted and
 * without repeats.
 *
 * Read from the content `pnpm fetch:profile` copied, so run that first.
 */
export const readProjectValues = async (
  field: 'repo' | 'npmPackage' | 'pypiPackage'
) => {
  const projects = await readFile(PROJECTS_FILE, 'utf8')
  return [
    ...new Set(
      [...projects.matchAll(new RegExp(`\\b${field}:\\s*'([^']+)'`, 'g'))].map(
        ([, value]) => value
      )
    ),
  ].sort()
}
