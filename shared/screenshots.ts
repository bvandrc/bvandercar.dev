/**
 * The widths `pnpm fetch:profile` makes each screenshot's thumbnails and
 * posters at.
 *
 * 480px is twice the 240px a desktop card shows one at, for a sharp screen.
 * 900px, the screenshots' own width, is for a phone, where one spans the card.
 */
export const THUMBNAIL_WIDTHS = [480, 900] as const

export type ThumbnailWidth = (typeof THUMBNAIL_WIDTHS)[number]

/** How many px of its screenshot's top a live preview's poster shows, unless its project's `embed` sets `posterHeight`. */
export const DEFAULT_POSTER_HEIGHT = 64

/**
 * The narrowest a poster is drawn, in CSS px: a live preview's toggle on a
 * 320px-wide phone.
 *
 * A poster keeps enough of its screenshot's top to fill a toggle this narrow,
 * which shows the most of it; a wider one crops the rest.
 */
export const POSTER_MIN_WIDTH = 280

/**
 * Where `pnpm fetch:profile` writes a screenshot's thumbnail at a width: beside
 * it, as WebP, at the same kind of repo-relative path a project's `screenshot`
 * takes.
 */
export const getThumbnailPath = (screenshot: string, width: ThumbnailWidth) =>
  screenshot.replace(/\.\w+$/, `.${width}w.webp`)

/**
 * Where `pnpm fetch:profile` writes a screenshot's poster at a width: beside it,
 * as WebP, like its thumbnails.
 *
 * A poster is only the top of the screenshot, as much as a phone shows across
 * a live preview's toggle, so it's a fraction of a thumbnail's bytes.
 */
export const getPosterPath = (screenshot: string, width: ThumbnailWidth) =>
  screenshot.replace(/\.\w+$/, `.poster.${width}w.webp`)
