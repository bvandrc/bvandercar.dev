/**
 * The widths `pnpm fetch:profile` makes each screenshot's thumbnails at.
 *
 * 480px is twice the 240px a desktop card shows one at, for a sharp screen.
 * 900px, the screenshots' own width, is for a phone, where one spans the card.
 */
export const THUMBNAIL_WIDTHS = [480, 900] as const

export type ThumbnailWidth = (typeof THUMBNAIL_WIDTHS)[number]

/**
 * Where `pnpm fetch:profile` writes a screenshot's thumbnail at a width: beside
 * it, as WebP, at the same kind of repo-relative path a project's `screenshot`
 * takes.
 */
export const getThumbnailPath = (screenshot: string, width: ThumbnailWidth) =>
  screenshot.replace(/\.\w+$/, `.${width}w.webp`)
