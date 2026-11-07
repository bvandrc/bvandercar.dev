import { Icon } from '@/components/primitives/Icon'
import { Tooltip } from '@/components/primitives/Tooltip'
import { PACKAGE_DOWNLOADS } from '@/generated/package-downloads'
import { COUNT_KINDS } from '@/generated/profile/content/counts'
import type { Project } from '@/generated/profile/content/projects'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { DownloadsChart } from './DownloadsChart'
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
 * Renders nothing for a repo with no counts. The hover also charts an npm or
 * PyPI package's weekly downloads, once it has more than a week of them.
 */
export const ProjectCounts = ({ repo, ...packages }: ProjectCountsProps) => {
  const counts = REPO_COUNTS[repo]
  if (!counts) {
    return null
  }
  const charted = getChartedDownloads(packages)
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
        charted ? (
          <div className="flex flex-col gap-2">
            {label}
            <DownloadsChart {...charted} />
          </div>
        ) : (
          label
        )
      }
      // The chart's history in words, for screen readers.
      aria-label={
        charted
          ? `${label}. ${describeWeeklyDownloads(charted.history, charted.registry)}`
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
