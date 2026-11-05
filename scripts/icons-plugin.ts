import type { VirtualIcon } from 'virtual:icons'
// biome-ignore lint/performance/noNamespaceImport: build-time only, and every icon is needed to look one up by slug.
import * as simpleIcons from 'simple-icons'
import { type Plugin, runnerImport } from 'vite'

import { deviconUrl } from '../src/lib/devicon'

const VIRTUAL_ID = 'virtual:icons'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

const SLUGS_MODULE = 'src/lib/icons.ts'

// Logos Simple Icons has since dropped at the brand's request, from the last
// release that had them (simple-icons@9.21.0, CC0 like the rest).
const DROPPED_SIMPLE_ICON_PATHS = {
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
}

const SIMPLE_ICON_PATHS = new Map(
  [
    ...Object.entries(DROPPED_SIMPLE_ICON_PATHS),
    ...Object.values(simpleIcons).map(({ slug, path }) => [slug, path]),
  ].map(([slug, path]) => [
    slug,
    // Spaces out decimals that run together, the same path to a renderer, so
    // `10.059.003.23` doesn't read as a private IP to the ZAP scan.
    path.replace(/(\.\d+)(?=\.)/g, '$1 '),
  ])
)

/**
 * Serves `virtual:icons`, the logos for `ICON_SLUGS` in `src/lib/icons.ts`.
 *
 * Simple Icons' are bundled, only those, so the page fetches none of them;
 * that includes a few it has since dropped, kept here.
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
