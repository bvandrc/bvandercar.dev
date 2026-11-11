import { Fragment, useEffect } from 'react'
import {
  createLazyLoad,
  type UsePressToggleOptions,
  usePressToggle,
} from '@bvandrc/react-toolkit'
import { omit } from 'es-toolkit'

import { Icon } from '@/components/primitives/Icon'
import { Tooltip, type TooltipProps } from '@/components/primitives/Tooltip'
import { cn } from '@/lib/cn'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import type { ProjectChartsProps } from './charts/ProjectCharts'
import type { getProjectCounts } from './lib/project-counts'

// Charts size the tooltip to themselves, with text to match, where the
// counts in words are a line of text.
const TOOLTIP_CLASSES = {
  CHARTS: 'max-w-none p-3 text-sm',
  WORDS: undefined,
} as const

/**
 * The charts' code and data, which stay out of the page's first load, and a
 * `prefetch` that starts loading them.
 *
 * Takes whether the counts may chart at all. Loading them for one set of
 * counts loads them for every other, mounted or mounted later.
 */
const useLazyCharts = createLazyLoad(() =>
  Promise.all([
    import('./charts/ProjectCharts'),
    import('./charts/lib/project-charts'),
    import('./charts/lib/total-charts'),
  ]).then(([{ ProjectCharts }, { getProjectCharts }, { getTotalCharts }]) => ({
    ProjectCharts,
    getProjectCharts,
    getTotalCharts,
  }))
)

/** The charts' lazily loaded code, which picks what a set of counts charts. */
export type LazyCharts = NonNullable<ReturnType<typeof useLazyCharts>['value']>

/** What a set of counts charts, and a sentence describing each chart for screen readers. */
export type CountsCharts = Omit<ProjectChartsProps, 'span'> &
  Pick<Required<ProjectChartsProps>, 'span'> & {
    descriptions: string[]
  }

// A tap stands in for the hover a touch screen lacks; a mouse, which can
// hover, clicks through to the link the counts sit in.
const TOGGLE_OPTIONS = {
  pointerTypes: ['touch'],
} satisfies UsePressToggleOptions

/**
 * The gap between two counts: 10px with room, closing to 4px without.
 *
 * Its width is 10px at most and 4px at least, which a flex `gap` can't be.
 */
const PairGap = () => (
  // Its pieces wrap onto lines no one sees, so it can shrink to the widest.
  <span className="flex h-0 flex-wrap overflow-hidden">
    <span className="w-1" />
    <span className="w-1" />
    <span className="w-0.5" />
  </span>
)

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

export type CountGlyphsProps = Pick<TooltipProps, 'open' | 'onOpenChange'> &
  Pick<ReturnType<typeof getProjectCounts>, 'shown' | 'chartCount'> & {
    /** Picks what the counts chart, once the charts' code has loaded; undefined for nothing */
    getCharts: (charts: LazyCharts) => CountsCharts | undefined
    className?: string
    'data-testid': string
  }

/**
 * Counts as glyphs with shortened numbers, in full as alt text, and on hover
 * where there's nothing to chart, like "3,120 downloads".
 *
 * Renders nothing for no counts. The hover shows the charts `getCharts`
 * picks in place of the counts in words, which load, with their data, the
 * first time the tooltip opens. On a touch screen, which has no hover, a tap
 * opens and closes the tooltip instead, rather than following a link the
 * counts sit in. Pass `open` and `onOpenChange` to also open it from
 * elsewhere.
 */
export const CountGlyphs = ({
  shown,
  chartCount,
  getCharts,
  open = false,
  onOpenChange,
  className,
  'data-testid': testId,
}: CountGlyphsProps) => {
  // Its pointerdown handler reads the state before Radix's own closes an open
  // tooltip, and its click handler cancels the click, which also stops
  // Radix's from closing it again.
  const { isActive, setIsActive, triggerProps } = usePressToggle(TOGGLE_OPTIONS)
  const mayChart = chartCount > 0
  // Charts that failed to load leave the counts in words, until the next
  // hover or tap tries again.
  const {
    value: charts,
    isFailed: chartsFailed,
    prefetch: prefetchCharts,
  } = useLazyCharts(mayChart)
  const countsCharts = charts && getCharts(charts)
  /** Opens or closes the tooltip, loading the charts as it opens, however it opened. */
  const changeOpen = (next: boolean) => {
    setIsActive(next)
    onOpenChange?.(next)
    if (next) {
      prefetchCharts()
    }
  }
  // Opened from outside, it loads the charts as it opens too.
  useEffect(() => {
    if (open) {
      prefetchCharts()
    }
  }, [open, prefetchCharts])
  if (shown.length === 0) {
    return null
  }
  const isLoading = mayChart && !charts && !chartsFailed
  const label = shown
    .map(({ count, noun }) => formatCount(count, noun))
    .join(', ')
  // The charts' history in words, for screen readers.
  const description = countsCharts
    ? [label, ...countsCharts.descriptions].join('. ')
    : undefined
  /** The charts, a blank space their size while they load, or else the counts in words. */
  const getContent = () => {
    if (countsCharts && charts) {
      return <charts.ProjectCharts {...omit(countsCharts, ['descriptions'])} />
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
        TOOLTIP_CLASSES[countsCharts || isLoading ? 'CHARTS' : 'WORDS']
      }>
      {/* An image, like the profile README's badge, so its name can be the
          full counts rather than the shortened ones it shows. */}
      <span
        role="img"
        aria-label={label}
        className={cn('flex items-center', className)}
        {...triggerProps}
        // Starts loading the charts as the pointer arrives, ahead of the
        // tooltip's open delay, or with a tap.
        onPointerEnter={prefetchCharts}
        onPointerDown={(event) => {
          prefetchCharts()
          triggerProps.onPointerDown(event)
        }}
        data-testid={testId}>
        {shown.map(({ key, icon, count }, index) => (
          <Fragment key={key}>
            {index > 0 && <PairGap />}
            <span className="inline-flex items-center gap-1">
              <Icon name={icon} className="size-[1.1em]" />
              {formatCompactCount(count)}
            </span>
          </Fragment>
        ))}
      </span>
    </Tooltip>
  )
}
