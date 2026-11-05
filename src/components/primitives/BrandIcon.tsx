import { BRAND_ICONS, type VirtualIcon } from 'virtual:icons'
import type { MergeExclusive } from 'type-fest'

export type BrandIconProps = Omit<
  React.ComponentProps<'img'>,
  'src' | 'width' | 'height'
> & {
  /** A slug from `ICON_SLUGS` in `src/lib/icons.ts` */
  slug: string
  /** Hex color, without the `#` */
  color: string
} & MergeExclusive<
    /** Width and height alike, for a square logo */
    { size: number },
    { width: number; height: number }
  >

const iconSrc = ({ body, viewBox }: VirtualIcon, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    // `color` sets what a one-color logo's `currentColor` draws in.
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" color="#${color}">${body}</svg>`
  )}`

/**
 * A brand's logo: Simple Icons' in the given color, or for the few it lacks,
 * Devicon's in the brand's own colors.
 *
 * A `title` doubles as the alt text, but `alt` alone shows no native tooltip.
 * Given neither, it is decorative. A slug with no logo renders nothing, so
 * it's best beside the brand's name.
 */
export const BrandIcon = ({
  slug,
  color,
  size,
  width = size,
  height = size,
  alt,
  title,
  ...props
}: BrandIconProps) => {
  const icon = BRAND_ICONS[slug]
  if (!icon) {
    return null
  }
  return (
    <img
      src={iconSrc(icon, color)}
      width={width}
      height={height}
      alt={alt ?? title ?? ''}
      title={title}
      {...props}
    />
  )
}
