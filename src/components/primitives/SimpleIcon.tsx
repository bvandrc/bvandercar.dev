import type { MergeExclusive } from 'type-fest'

export type SimpleIconProps = Omit<
  React.ComponentProps<'img'>,
  'src' | 'width' | 'height'
> & {
  /** simpleicons.org slug */
  slug: string
  /** Hex color, without the `#` */
  color: string
} & MergeExclusive<
    /** Width and height alike, for a square logo */
    { size: number },
    { width: number; height: number }
  >

/**
 * A Simple Icons logo in the given color.
 *
 * Given only one of `alt` and `title`, it uses that for both. Given neither,
 * it is decorative.
 */
export const SimpleIcon = ({
  slug,
  color,
  size,
  width = size,
  height = size,
  alt,
  title,
  ...props
}: SimpleIconProps) => (
  <img
    src={`https://cdn.simpleicons.org/${slug}/${color}`}
    width={width}
    height={height}
    alt={alt ?? title ?? ''}
    title={title ?? alt}
    {...props}
  />
)
