/// <reference types="vite/client" />

/** The site's logos, bundled by `scripts/icons-plugin.ts`. */
declare module 'virtual:icons' {
  /** A Simple Icons path to fill in any color, or a fallback logo's own image. */
  export type VirtualIcon = { path: string } | { src: string }

  /** Keyed by slug, for every slug in `ICON_SLUGS` that has a logo. */
  export const ICONS: Partial<Record<string, VirtualIcon>>
}
