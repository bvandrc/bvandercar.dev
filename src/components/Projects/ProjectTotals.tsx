import { useFocusVisibleOpen } from '@bvandrc/react-toolkit'

import { Link } from '@/components/primitives/Link'
import { SECTIONS } from '@/generated/profile/content/sections'
import { sectionAnchor } from '@/lib/section-anchor'
import { CountGlyphs } from './CountGlyphs'
import { getProjectTotals } from './lib/project-totals'

/**
 * Every project's commits, merged PRs, and downloads added up, as glyphs,
 * linking up to the projects.
 *
 * Hovering them, or keyboard focus on the link, charts each as a running
 * total across every project, as `getTotalCharts` decides, in place of the
 * counts in words. Renders nothing for no counts.
 */
export const ProjectTotals = () => {
  const { open, setOpen, focusProps } = useFocusVisibleOpen()
  const { shown, chartCount, repos, packages } = getProjectTotals()
  if (shown.length === 0) {
    return null
  }
  return (
    <Link
      href={`#${sectionAnchor(SECTIONS.PROJECTS.title)}`}
      tone="muted"
      className="inline-flex items-center gap-2"
      {...focusProps}
      data-testid="project-totals-link">
      <CountGlyphs
        shown={shown}
        chartCount={chartCount}
        getCharts={(charts) => charts.getTotalCharts(repos, packages)}
        open={open}
        onOpenChange={setOpen}
        data-testid="project-totals"
      />
      across projects
    </Link>
  )
}
