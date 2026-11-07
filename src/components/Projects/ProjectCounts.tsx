import { Icon } from '@/components/primitives/Icon'
import { Tooltip } from '@/components/primitives/Tooltip'
import { NPM_DOWNLOADS } from '@/generated/npm-downloads'
import { COUNT_KINDS } from '@/generated/profile/content/counts'
import type { Project } from '@/generated/profile/content/projects'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { DownloadsChart } from './DownloadsChart'
import { describeWeeklyDownloads } from './lib/weekly-downloads'

export type ProjectCountsProps = Pick<Project, 'repo' | 'npmPackage'>

/**
 * A repo's counts as glyphs with shortened numbers, in full as alt text and on
 * hover, like "3,120 downloads".
 *
 * Renders nothing for a repo with no counts. The hover also charts an npm
 * package's weekly downloads, once it has more than a week of them.
 */
export const ProjectCounts = ({ repo, npmPackage }: ProjectCountsProps) => {
  const counts = REPO_COUNTS[repo]
  if (!counts) {
    return null
  }
  const history = npmPackage ? NPM_DOWNLOADS[npmPackage] : undefined
  // A single week is a point, not a trend.
  const chartedHistory =
    history && history.weekly.length > 1 ? history : undefined
  // The profile README badge's counts, in its order and with its icons.
  const shown = COUNT_KINDS.flatMap(({ key, icon, noun }) => {
    const count = counts[key]
    return count === undefined ? [] : [{ key, icon, noun, count }]
  })
  const label = shown
    .map(({ count, noun }) => formatCount(count, noun))
    .join(', ')
  return (
    <Tooltip
      content={
        chartedHistory ? (
          <div className="flex flex-col gap-2">
            {label}
            <DownloadsChart history={chartedHistory} />
          </div>
        ) : (
          label
        )
      }
      // The chart's history in words, for screen readers.
      aria-label={
        chartedHistory
          ? `${label}. ${describeWeeklyDownloads(chartedHistory)}`
          : undefined
      }>
      {/* An image, like the profile README's badge, so its name can be the
          full counts rather than the shortened ones it shows. */}
      <span
        role="img"
        aria-label={label}
        className="inline-flex items-center gap-2.5"
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
