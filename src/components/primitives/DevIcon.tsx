import type { DistributedOmit } from 'type-fest'

import { SimpleIcon, type SimpleIconProps } from './SimpleIcon'

export type DevIconProps = DistributedOmit<SimpleIconProps, 'onError'>

/**
 * A developer tool's logo: Simple Icons' in the given color where it has one.
 *
 * Else it shows Devicon's, in its original colors, for the logos Simple Icons
 * lacks, like Playwright's, which it withdrew. Where neither has the slug, the
 * image hides, so it's best beside the tool's name.
 */
export const DevIcon = ({ slug, ...props }: DevIconProps) => (
  <SimpleIcon
    slug={slug}
    {...props}
    onError={(event) => {
      const img = event.currentTarget
      if (img.dataset.fallback) {
        img.hidden = true
        return
      }
      img.dataset.fallback = 'devicon'
      // Pinned, since jsDelivr serves the package as published.
      img.src = `https://cdn.jsdelivr.net/npm/devicon@2.18.0/icons/${slug}/${slug}-original.svg`
    }}
  />
)
