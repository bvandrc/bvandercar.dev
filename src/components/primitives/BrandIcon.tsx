import { ICONS, type VirtualIcon } from 'virtual:icons'
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

const iconSrc = (icon: VirtualIcon, color: string) =>
  'src' in icon
    ? icon.src
    : `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#${color}"><path d="${icon.path}"/></svg>`
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
  const icon = ICONS[slug]
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
