import { isNotNil } from 'es-toolkit'

import { Icon } from '@/components/primitives/Icon'
import { Tooltip } from '@/components/primitives/Tooltip'
import { PACKAGE_DOWNLOADS } from '@/generated/package-downloads'
import { COUNT_KINDS } from '@/generated/profile/content/counts'
import type { Project } from '@/generated/profile/content/projects'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { REPO_ACTIVITY } from '@/generated/repo-activity'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { cn } from '@/utils'
import { ActivityChart } from './ActivityChart'
import { DownloadsChart } from './DownloadsChart'
import { describeWeeklyActivity } from './lib/weekly-activity'
import { describeWeeklyDownloads } from './lib/weekly-downloads'

export type ProjectCountsProps = Pick<
  Project,
  'repo' | 'npmPackage' | 'pypiPackage'
>

/** The project's package's weekly downloads and their registry, if there are enough to chart. */
const getChartedDownloads = ({
  npmPackage,
  pypiPackage,
}: Omit<ProjectCountsProps, 'repo'>) => {
  for (const [registry, pkg] of [
    ['npm', npmPackage],
    ['pypi', pypiPackage],
  ] as const) {
    const history = pkg ? PACKAGE_DOWNLOADS[registry][pkg] : undefined
    // A single week is a point, not a trend.
    if (history && history.weekly.length > 1) {
      return { registry, history }
    }
  }
  return undefined
}

/**
 * A repo's counts as glyphs with shortened numbers, in full as alt text and on
 * hover, like "3,120 downloads".
 *
 * Renders nothing for a repo with no counts. The hover also charts the repo's
 * weekly commits and PRs, and an npm or PyPI package's weekly downloads, each
 * once it has more than a week of them.
 */
export const ProjectCounts = ({ repo, ...packages }: ProjectCountsProps) => {
  const counts = REPO_COUNTS[repo]
  if (!counts) {
    return null
  }
  const chartedDownloads = getChartedDownloads(packages)
  // The profile README badge's counts, in its order and with its icons.
  const shown = COUNT_KINDS.flatMap(({ key, icon, noun }) => {
    const count = counts[key]
    return count === undefined ? [] : [{ key, icon, noun, count }]
  })
  const label = shown
    .map(({ count, noun }) => formatCount(count, noun))
    .join(', ')
  const activity = REPO_ACTIVITY[repo]
  // A single week is a point, not a trend.
  const chartedActivity =
    activity && activity.commits.length > 1 ? activity : undefined
  // The charts' history in words, for screen readers.
  const description = [
    label,
    chartedActivity && describeWeeklyActivity(chartedActivity),
    chartedDownloads &&
      describeWeeklyDownloads(
        chartedDownloads.history,
        chartedDownloads.registry
      ),
  ]
    .filter(isNotNil)
    .join('. ')
  return (
    <Tooltip
      content={
        chartedActivity || chartedDownloads ? (
          <div className="flex flex-col gap-3">
            {chartedActivity && <ActivityChart activity={chartedActivity} />}
            {chartedDownloads && <DownloadsChart {...chartedDownloads} />}
            <p
              className={cn(
                'font-bold',
                // Set off from the readout above it, which is white on hover too.
                'border-t border-ink-muted/30 pt-2'
              )}>
              {label}
            </p>
          </div>
        ) : (
          label
        )
      }
      aria-label={description === label ? undefined : description}>
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
