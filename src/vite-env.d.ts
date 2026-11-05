/// <reference types="vite/client" />

/** The site's icons, from Iconify's sets, bundled by `scripts/icons-plugin.ts`. */
declare module 'virtual:icons' {
  /**
   * An SVG's contents and the `viewBox` they're drawn in.
   *
   * A one-color icon draws in `currentColor`; a multicolor one, in its own.
   */
  export type VirtualIcon = { body: string; viewBox: string }

  /** Logos keyed by slug, for every slug in `ICON_SLUGS` that has one. */
  export const BRAND_ICONS: Partial<Record<string, VirtualIcon>>

  /** Interface glyphs, for every name in `UI_ICON_NAMES`. */
  export const UI_ICONS: Record<import('@/lib/icons').UiIconName, VirtualIcon>
}
