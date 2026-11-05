import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { VirtualIcon } from 'virtual:icons'
// biome-ignore lint/performance/noNamespaceImport: build-time only, and every icon is needed to look one up by slug.
import * as simpleIcons from 'simple-icons'
import { type Plugin, runnerImport } from 'vite'

const VIRTUAL_ID = 'virtual:icons'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

const SLUGS_MODULE = 'src/lib/icons.ts'

// Logos Simple Icons withdrew or never had, as `<slug>.svg`. Playwright's is
// Devicon's (MIT).
const FALLBACK_DIR = 'src/assets/icons'

const SIMPLE_ICON_PATHS = new Map(
  Object.values(simpleIcons).map(({ slug, path }) => [slug, path])
)

/**
 * Serves `virtual:icons`, the logos for `ICON_SLUGS` in `src/lib/icons.ts`.
 *
 * Bundling only those keeps the rest of Simple Icons out of the build, and the
 * page from fetching each logo from a CDN. A slug with no logo either way is
 * left out, with a build warning.
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
    const icons: Record<string, VirtualIcon> = {}
    for (const slug of module.ICON_SLUGS) {
      const path = SIMPLE_ICON_PATHS.get(slug)
      if (path) {
        icons[slug] = { path }
        continue
      }
      const file = join(FALLBACK_DIR, `${slug}.svg`)
      const svg = await readFile(file, 'utf8').catch(() => undefined)
      if (!svg) {
        this.warn(`No logo for "${slug}" in Simple Icons or ${FALLBACK_DIR}/`)
        continue
      }
      icons[slug] = {
        src: `data:image/svg+xml,${encodeURIComponent(svg.trim())}`,
      }
    }
    return `export const ICONS = ${JSON.stringify(icons)}`
  },
})
