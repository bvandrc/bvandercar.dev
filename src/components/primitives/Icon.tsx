import { UI_ICONS } from 'virtual:icons'

import type { GlyphName } from '@/lib/icons'

export type IconProps = Omit<
  React.ComponentProps<'svg'>,
  'children' | 'viewBox' | 'dangerouslySetInnerHTML'
> & {
  /** A name from `GLYPH_NAMES` in `src/lib/icons.ts` */
  name: GlyphName
}

/**
 * An interface glyph, drawn in the text color around it and decorative.
 *
 * It is 1em square unless a class sizes it. A name the build didn't bundle
 * renders nothing.
 */
export const Icon = ({ name, ...props }: IconProps) => {
  const icon = UI_ICONS[name]
  if (!icon) {
    return null
  }
  const { body, viewBox } = icon
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the body is Iconify's SVG markup, bundled at build time, never user input.
      dangerouslySetInnerHTML={{ __html: body }}
      {...props}
    />
  )
}
