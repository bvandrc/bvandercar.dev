import type { VirtualIcon } from 'virtual:icons'
// biome-ignore lint/performance/noNamespaceImport: build-time only, and every icon is needed to look one up by slug.
import * as simpleIcons from 'simple-icons'
import { type Plugin, runnerImport } from 'vite'

import { deviconUrl } from '../src/lib/devicon'

const VIRTUAL_ID = 'virtual:icons'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

const SLUGS_MODULE = 'src/lib/icons.ts'

const SIMPLE_ICON_PATHS = new Map(
  Object.values(simpleIcons).map(({ slug, path }) => [slug, path])
)

/**
 * Serves `virtual:icons`, the logos for `ICON_SLUGS` in `src/lib/icons.ts`.
 *
 * Simple Icons' are bundled, only those, so the page fetches none of them.
 * For the few it lacks, the build checks Devicon has one and links to it, so
 * the page never logs a 404. A slug neither has is left out, with a build
 * warning.
 */
export const iconsPlugin = (): Plugin => ({
  name: 'icons',
  resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
  async load(id) {
    if (id !== RESOLVED_ID) {
      return
    }
    // Run through Vite, which resolves the content modules' `@/` imports.
    const { module } = await runnerImport<typeof import('../src/lib/icons')>(
      SLUGS_MODULE,
      { configFile: false, resolve: { tsconfigPaths: true } }
    )
    const entries = await Promise.all(
      module.ICON_SLUGS.map(async (slug): Promise<[string, VirtualIcon][]> => {
        const path = SIMPLE_ICON_PATHS.get(slug)
        if (path) {
          return [[slug, { path }]]
        }
        const src = deviconUrl(slug)
        const response = await fetch(src, { method: 'HEAD' }).catch(
          (error: unknown) => {
            this.warn(`Couldn't check Devicon for "${slug}": ${error}`)
          }
        )
        // Unreachable, say offline: keep the logo rather than drop it.
        if (!response || response.ok) {
          return [[slug, { src }]]
        }
        this.warn(`No logo for "${slug}" in Simple Icons or Devicon`)
        return []
      })
    )
    return `export const ICONS = ${JSON.stringify(Object.fromEntries(entries.flat()))}`
  },
})
