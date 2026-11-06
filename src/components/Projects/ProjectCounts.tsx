import { Icon } from '@/components/primitives/Icon'
import { Tooltip } from '@/components/primitives/Tooltip'
import { COUNT_KINDS } from '@/generated/profile/content/counts'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { cn } from '@/utils'

export type ProjectCountsProps = Pick<
  React.ComponentProps<'span'>,
  'className'
> & {
  /** GitHub repo name under bvandrc */
  repo: string
}

/**
 * A repo's counts as glyphs with shortened numbers, in full as alt text and on
 * hover, like "3,120 downloads".
 *
 * Renders nothing for a repo with no counts.
 */
export const ProjectCounts = ({ repo, className }: ProjectCountsProps) => {
  const counts = REPO_COUNTS[repo]
  if (!counts) {
    return null
  }
  // The profile README badge's counts, in its order and with its icons.
  const shown = COUNT_KINDS.flatMap(({ key, icon, noun }) => {
    const count = counts[key]
    return count === undefined ? [] : [{ key, icon, noun, count }]
  })
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
        className={cn('inline-flex items-center gap-2.5', className)}
        data-testid="project-counts">
        {shown.map(({ key, icon, count }) => (
          <span key={key} className="inline-flex items-center gap-1">
            <Icon name={icon} className="size-[1.1em]" />
            {formatCompactCount(count)}
          </span>
        ))}
      </span>
    </Tooltip>
  )
}
