import { mkdir, writeFile } from 'node:fs/promises'

import { SITE_URL } from '../../site.config.ts'
import { getErrorMessage } from './errors.ts'
import { fetchJson } from './http.ts'

// Copied into the built site, gitignored. The site never loads them; only the
// next build does, from the live site, where they last as long as the deploy,
// unlike an Actions cache, which GitHub drops after a week unused.
const PUBLISHED_DIR = 'public/data'

/**
 * What the live site published as `file`, or nothing where it has none or
 * can't be reached, which `label`, the fetch's name, logs.
 */
export const readPublished = async <T extends object>(
  label: string,
  file: string
): Promise<Partial<T>> => {
  try {
    return await fetchJson<T>(`${SITE_URL}data/${file}`)
  } catch (error) {
    console.log(
      `${label}: starting without the live site's ${file}: ${getErrorMessage(error)}`
    )
    return {}
  }
}

/** Writes `data` as `file`, for the deploy to publish with the site, and the next build to read back. */
export const writePublished = async (file: string, data: object) => {
  await mkdir(PUBLISHED_DIR, { recursive: true })
  await writeFile(`${PUBLISHED_DIR}/${file}`, JSON.stringify(data))
}
