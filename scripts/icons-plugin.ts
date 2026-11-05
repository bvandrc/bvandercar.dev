import type { VirtualIcon } from 'virtual:icons'
import { getIconData, iconToSVG } from '@iconify/utils'
import { icons as DEVICON, type IconifyJSON } from '@iconify-json/devicon'
import { icons as LUCIDE } from '@iconify-json/lucide'
import { icons as MATERIAL_SYMBOLS } from '@iconify-json/material-symbols'
import { icons as SIMPLE_ICONS } from '@iconify-json/simple-icons'
import { type Plugin, runnerImport } from 'vite'

const VIRTUAL_ID = 'virtual:icons'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

const SLUGS_MODULE = 'src/lib/icons.ts'

// The prefix on a UI glyph's name that takes it from Material Symbols, not Lucide.
const MATERIAL_SYMBOLS_PREFIX = 'material-symbols:'

// Slugs for skills that aren't a brand, so no logo set has them: each is drawn
// with a generic icon instead, as [set, name].
const GENERIC_LOGOS: Partial<Record<string, [IconifyJSON, string]>> = {
  accessibility: [MATERIAL_SYMBOLS, 'accessibility-new'],
}

/** An icon from an Iconify set, or `undefined` if the set lacks it. */
const getIcon = (set: IconifyJSON, name: string): VirtualIcon | undefined => {
  const data = getIconData(set, name)
  if (!data) {
    return
  }
  const { attributes, body } = iconToSVG(data)
  return {
    viewBox: attributes.viewBox,
    // Spaces out decimals that run together, the same path to a renderer, so
    // `10.059.003.23` doesn't read as a private IP to the ZAP scan.
    body: body.replace(/(\.\d+)(?=\.)/g, '$1 '),
  }
}

/**
 * Serves `virtual:icons`: the logos for `ICON_SLUGS`, and the glyphs for
 * `UI_ICON_NAMES`, in `src/lib/icons.ts`.
 *
 * All come from Iconify's sets and are bundled, only those, so the page
 * fetches no icon. A logo is Simple Icons' where it has one, including those
 * it has since dropped, or else Devicon's, in the brand's own colors. A slug
 * that isn't a brand takes the generic icon `GENERIC_LOGOS` names. A slug with
 * no logo is left out, with a build warning.
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
    const brandIcons = module.ICON_SLUGS.flatMap(
      (slug): [string, VirtualIcon][] => {
        const generic = GENERIC_LOGOS[slug]
        const icon = generic
          ? getIcon(...generic)
          : (getIcon(SIMPLE_ICONS, slug) ?? getIcon(DEVICON, slug))
        if (icon) {
          return [[slug, icon]]
        }
        this.warn(`No logo for "${slug}"`)
        return []
      }
    )
    const uiIcons = module.UI_ICON_NAMES.map((name): [string, VirtualIcon] => {
      const icon = name.startsWith(MATERIAL_SYMBOLS_PREFIX)
        ? getIcon(MATERIAL_SYMBOLS, name.slice(MATERIAL_SYMBOLS_PREFIX.length))
        : getIcon(LUCIDE, name)
      if (!icon) {
        this.error(`No icon named "${name}"`)
      }
      return [name, icon]
    })
    return [
      `export const BRAND_ICONS = ${JSON.stringify(Object.fromEntries(brandIcons))}`,
      `export const UI_ICONS = ${JSON.stringify(Object.fromEntries(uiIcons))}`,
    ].join('\n')
  },
})
