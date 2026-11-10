/** How wide `pnpm fetch:profile` makes each screenshot's thumbnail: twice the 240px a project card shows it at, for a sharp screen. */
export const THUMBNAIL_WIDTH = 480

/**
 * Where `pnpm fetch:profile` writes a screenshot's thumbnail: beside it, as
 * WebP, at the same kind of repo-relative path a project's `screenshot` takes.
 */
export const getThumbnailPath = (screenshot: string) =>
  screenshot.replace(/\.\w+$/, '.thumb.webp')
