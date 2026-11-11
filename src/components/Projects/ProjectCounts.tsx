import type { Project } from '@/generated/profile/content/projects'
import type { CountsField } from '~/counts'
import { Counts, type CountsProps } from './Counts'
import { getProjectCounts } from './lib/project-counts'

export type ProjectCountsProps = Pick<Project, CountsField> &
  Pick<CountsProps, 'open' | 'onOpenChange'>

/**
 * A repo's counts as glyphs with shortened numbers, in full as alt text, and
 * on hover where there's nothing to chart, like "3,120 downloads".
 *
 * Renders nothing for a repo with no counts. The hover charts the repo's
 * commits, and an npm or PyPI package's downloads, as running totals,
 * marking the package's releases on both, in place of the counts in words,
 * as `getProjectCharts` decides. The charts, and their data, load the first
 * time the tooltip opens.
 * On a touch screen, which has no hover, a tap opens and closes the tooltip
 * instead, rather than following a link the counts sit in. Pass `open` and
 * `onOpenChange` to also open it from elsewhere.
 */
export const ProjectCounts = ({
  repo,
  open,
  onOpenChange,
  ...packages
}: ProjectCountsProps) => {
  const { shown, pkg, chartCount } = getProjectCounts({ repo, ...packages })
  return (
    <Counts
      shown={shown}
      chartCount={chartCount}
      getCharts={(charts) => charts.getProjectCharts(repo, pkg)}
      open={open}
      onOpenChange={onOpenChange}
      // Takes the room its gaps need at their tightest, then grows them back
      // as room allows, so they close up before "repo" wraps below.
      className="max-w-max grow basis-0"
      data-testid="project-counts"
    />
  )
}
