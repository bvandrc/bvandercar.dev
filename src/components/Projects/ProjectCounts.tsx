import { useEffect, useEffectEvent } from 'react'
import {
  type UsePressToggleOptions,
  usePressToggle,
} from '@bvandrc/react-toolkit'

import { Icon } from '@/components/primitives/Icon'
import { Tooltip, type TooltipProps } from '@/components/primitives/Tooltip'
import { COUNT_KINDS } from '@/generated/profile/content/counts'
import type { Project } from '@/generated/profile/content/projects'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import type { CountsField } from '~/counts'
import { useLazyCharts } from './hooks/useLazyCharts'
import { getProjectCounts } from './lib/project-counts'

// Charts size the tooltip to themselves, with text to match, where the
// counts in words are a line of text.
const TOOLTIP_CLASSES = {
  CHARTS: 'max-w-none p-3 text-sm',
  WORDS: undefined,
} as const

// A tap stands in for the hover a touch screen lacks; a mouse, which can
// hover, clicks through to the link the counts sit in.
const TOGGLE_OPTIONS = {
  pointerTypes: ['touch'],
} satisfies UsePressToggleOptions

type ChartsPlaceholderProps = {
  /** How many charts may show */
  count: number
}

/** A blank chart's size for each that may show, so the tooltip jumps as little as it can once they load. */
const ChartsPlaceholder = ({ count }: ChartsPlaceholderProps) => (
  <div className="flex flex-col gap-3" data-testid="project-charts-loading">
    {Array.from({ length: count }, (_, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: the blanks have no identity of their own.
      <div key={index} className="h-21 w-82" />
    ))}
  </div>
)

export type ProjectCountsProps = Pick<Project, CountsField> &
  Pick<TooltipProps, 'open' | 'onOpenChange'>

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
  open = false,
  onOpenChange,
  ...packages
}: ProjectCountsProps) => {
  // Its pointerdown handler reads the state before Radix's own closes an open
  // tooltip, and its click handler cancels the click, which also stops
  // Radix's from closing it again.
  const { isActive, setIsActive, triggerProps } = usePressToggle(TOGGLE_OPTIONS)
  const { counts, pkg, chartCount } = getProjectCounts({ repo, ...packages })
  const mayChart = chartCount > 0
  // Charts that failed to load leave the counts in words.
  const { charts, prefetchCharts } = useLazyCharts(mayChart)
  const projectCharts = charts?.getProjectCharts(repo, pkg)
  /** Opens or closes the tooltip, loading the charts as it opens, however it opened. */
  const changeOpen = (next: boolean) => {
    setIsActive(next)
    onOpenChange?.(next)
    if (next) {
      prefetchCharts()
    }
  }
  // Opened from outside, it loads the charts as it opens too.
  const prefetchOnOpen = useEffectEvent(prefetchCharts)
  useEffect(() => {
    if (open) {
      prefetchOnOpen()
    }
  }, [open])
  // The profile README badge's counts, in its order and with its icons.
  const shown = COUNT_KINDS.flatMap(({ key, icon, noun }) => {
    const count = counts[key]
    return count === undefined ? [] : [{ key, icon, noun, count }]
  })
  if (shown.length === 0) {
    return null
  }
  const isLoading = mayChart && charts === undefined
  const label = shown
    .map(({ count, noun }) => formatCount(count, noun))
    .join(', ')
  // The charts' history in words, for screen readers.
  const description = projectCharts
    ? [label, ...projectCharts.descriptions].join('. ')
    : undefined
  /** The charts, a blank space their size while they load, or else the counts in words. */
  const getContent = () => {
    if (projectCharts && charts) {
      return (
        <charts.ProjectCharts
          activity={projectCharts.activity}
          downloads={projectCharts.downloads}
          releases={projectCharts.releases}
          span={projectCharts.span}
        />
      )
    }
    if (isLoading) {
      return <ChartsPlaceholder count={chartCount} />
    }
    return label
  }
  return (
    <Tooltip
      open={isActive || open}
      onOpenChange={changeOpen}
      content={getContent()}
      aria-label={description}
      className={
        TOOLTIP_CLASSES[projectCharts || isLoading ? 'CHARTS' : 'WORDS']
      }>
      {/* An image, like the profile README's badge, so its name can be the
          full counts rather than the shortened ones it shows. */}
      <span
        role="img"
        aria-label={label}
        className="inline-flex items-center gap-2.5"
        {...triggerProps}
        // Starts loading the charts as the pointer arrives, ahead of the
        // tooltip's open delay, or with a tap.
        onPointerEnter={prefetchCharts}
        onPointerDown={(event) => {
          prefetchCharts()
          triggerProps.onPointerDown(event)
        }}
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
