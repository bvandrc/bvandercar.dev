import type { VirtualIcon } from 'virtual:icons'
import { getIconData, iconToSVG } from '@iconify/utils'
import { icons as DEVICON, type IconifyJSON } from '@iconify-json/devicon'
import { icons as LUCIDE } from '@iconify-json/lucide'
import { icons as MATERIAL_SYMBOLS } from '@iconify-json/material-symbols'
import { icons as SIMPLE_ICONS } from '@iconify-json/simple-icons'
import { colord, extend } from 'colord'
import a11yPlugin from 'colord/plugins/a11y'
import { type Plugin, runnerImport } from 'vite'

import type { SkillBadge } from '../src/generated/profile/content/skills.ts'
import { THEME_COLORS } from '../src/lib/theme-colors.ts'

const VIRTUAL_ID = 'virtual:icons'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

const SLUGS_MODULE = 'src/lib/icons.ts'

// The prefixes on a glyph's name that take it from another set than Lucide.
const GLYPH_SETS: Record<string, IconifyJSON> = {
  'material-symbols:': MATERIAL_SYMBOLS,
  'simple-icons:': SIMPLE_ICONS,
}

/** A glyph by its name: Lucide's, or a prefixed set's. */
const getGlyph = (name: string) => {
  const prefix = Object.keys(GLYPH_SETS).find((p) => name.startsWith(p))
  return prefix
    ? getIcon(GLYPH_SETS[prefix], name.slice(prefix.length))
    : getIcon(LUCIDE, name)
}

// Slugs for skills that aren't a brand, so no logo set has them: each is drawn
// with a generic icon instead, as [set, name].
const GENERIC_LOGOS: Partial<Record<string, [IconifyJSON, string]>> = {
  accessibility: [MATERIAL_SYMBOLS, 'accessibility-new'],
}

// Adds colord's WCAG contrast and luminance methods.
extend([a11yPlugin])

/** Below this WCAG contrast ratio against the chip, a brand color is too dark to see. */
const MIN_ICON_CONTRAST = 2

/**
 * A skill logo's brand color, from its shields.io badge.
 *
 * The badge's logo color where that's a real color, else its background,
 * since a white or black logo was only ever drawn on that. One too dark for
 * the chip uses the chip's ink.
 */
const skillIconColor = ({ logoColor, path }: SkillBadge) => {
  const logoHex = decodeURIComponent(logoColor).replace('#', '')
  const badgeHex = decodeURIComponent(path).match(
    /-#?([0-9a-f]{6})(?:\.svg)?$/i
  )?.[1]
  const brand = colord(`#${logoHex}`).isValid() ? logoHex : badgeHex
  return brand &&
    colord(`#${brand}`).contrast(`#${THEME_COLORS.SURFACE}`) >=
      MIN_ICON_CONTRAST
    ? brand
    : THEME_COLORS.INK
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
 * Serves `virtual:icons`: the logos for `ICON_SLUGS`, the glyphs for
 * `GLYPH_NAMES`, and the colors for `SKILL_BADGES`' logos, in
 * `src/lib/icons.ts`.
 *
 * All come from Iconify's sets and are bundled, only those, so the page
 * fetches no icon. A logo is Simple Icons' where it has one, including those
 * it has since dropped, or else Devicon's, in the brand's own colors. A slug
 * that isn't a brand takes the generic icon `GENERIC_LOGOS` names. A slug with
 * no logo is left out, with a build warning. The colors are worked out here
 * so the page ships no color library.
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
    const uiIcons = module.GLYPH_NAMES.map((name): [string, VirtualIcon] => {
      const icon = getGlyph(name)
      if (!icon) {
        this.error(`No icon named "${name}"`)
      }
      return [name, icon]
    })
    const skillIconColors = module.SKILL_BADGES.map((skill) => [
      module.skillIconSlug(skill),
      skillIconColor(skill),
    ])
    return [
      `export const BRAND_ICONS = ${JSON.stringify(Object.fromEntries(brandIcons))}`,
      `export const UI_ICONS = ${JSON.stringify(Object.fromEntries(uiIcons))}`,
      `export const SKILL_ICON_COLORS = ${JSON.stringify(Object.fromEntries(skillIconColors))}`,
    ].join('\n')
  },
})
