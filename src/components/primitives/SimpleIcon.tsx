export type SimpleIconProps = Omit<React.ComponentProps<'img'>, 'src'> & {
  /** simpleicons.org slug */
  slug: string
  /** Hex color, without the `#` */
  color: string
}

/** A Simple Icons logo in the given color, decorative unless given an `alt`. */
export const SimpleIcon = ({
  slug,
  color,
  alt = '',
  ...props
}: SimpleIconProps) => (
  <img
    src={`https://cdn.simpleicons.org/${slug}/${color}`}
    alt={alt}
    {...props}
  />
)
