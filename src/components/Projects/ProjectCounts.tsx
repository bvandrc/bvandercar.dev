import { objectEntries } from 'ts-extras'
import type { ValueOf } from 'type-fest'

import { Icon } from '@/components/primitives/Icon'
import { Tooltip } from '@/components/primitives/Tooltip'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import type { GlyphName } from '@/lib/icons'

type RepoCounts = NonNullable<ValueOf<typeof REPO_COUNTS>>

// The GitHub profile README's counts, in its order, with Lucide's take on its
// Octicons to match this site's other glyphs.
const COUNT_KINDS = {
  commits: { glyph: 'git-commit-horizontal', noun: 'commit' },
  prs: { glyph: 'git-pull-request', noun: 'PR' },
  downloads: { glyph: 'download', noun: 'download' },
} satisfies Record<keyof RepoCounts, { glyph: GlyphName; noun: string }>

export type ProjectCountsProps = {
  /** GitHub repo name under bvandrc */
  repo: string
}

/**
 * A repo's counts as glyphs with shortened numbers, in full as alt text and on
 * hover, like "3,120 downloads".
 *
 * Renders nothing for a repo with no counts.
 */
export const ProjectCounts = ({ repo }: ProjectCountsProps) => {
  const counts = REPO_COUNTS[repo]
  if (!counts) {
    return null
  }
  const shown = objectEntries(COUNT_KINDS).flatMap(
    ([kind, { glyph, noun }]) => {
      const count = counts[kind]
      return count === undefined ? [] : [{ kind, glyph, noun, count }]
    }
  )
  const label = shown
    .map(({ count, noun }) => formatCount(count, noun))
    .join(', ')
  return (
    <Tooltip content={label}>
      {/* An image, like the profile README's badge, so its name can be the
          full counts rather than the shortened ones it shows. */}
      <span
        role="img"
        aria-label={label}
        className="inline-flex items-center gap-2.5"
        data-testid="project-counts">
        {shown.map(({ kind, glyph, count }) => (
          <span key={kind} className="inline-flex items-center gap-1">
            <Icon name={glyph} className="size-[1.1em]" />
            {formatCompactCount(count)}
          </span>
        ))}
      </span>
    </Tooltip>
  )
}
