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

type Placement = 'IN_LINK' | 'ALONE'

// Counts in a link toggle only on a tap, which stands in for the hover a
// touch screen lacks, and a mouse clicks through to the link. Counts on their
// own toggle on any press, which is cancelled, so Radix's own click handler
// doesn't close what it opened, and a card around them doesn't act on it.
const TOGGLE_OPTIONS = {
  IN_LINK: { pointerTypes: ['touch'] },
  ALONE: { cancelClick: true },
} satisfies Record<Placement, UsePressToggleOptions>

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

/** A blank chart's size for each that may show, and a blank period switch, so the tooltip jumps as little as it can once they load. */
const ChartsPlaceholder = ({ count }: ChartsPlaceholderProps) => (
  <div className="flex flex-col gap-3" data-testid="project-charts-loading">
    {Array.from({ length: count }, (_, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: the blanks have no identity of their own.
      <div key={index} className="h-21 w-82" />
    ))}
    <div className="h-5 w-82" />
  </div>
)

export type CountsProps = Pick<TooltipProps, 'open' | 'onOpenChange'> &
  Pick<ReturnType<typeof getProjectCounts>, 'shown' | 'chartCount'> & {
    /** Picks what the counts chart, once the charts' code has loaded; undefined for nothing */
    getCharts: (charts: LazyCharts) => CountsCharts | undefined
    /** Sits in a link, whose keyboard focus opens the tooltip, and which a mouse click follows */
    inLink?: boolean
    className?: string
    'data-testid': string
    /** Words beside the glyphs, which open the tooltip too */
    children?: React.ReactNode
  }

/**
 * Counts as glyphs with shortened numbers, in full as alt text, and on hover
 * where there's nothing to chart, like "3,120 downloads".
 *
 * Renders nothing for no counts. The hover shows the charts `getCharts`
 * picks in place of the counts in words, which load, with their data, the
 * first time the tooltip opens. The counts are a tab stop, whose keyboard
 * focus opens it, and a tap, click, Enter, or Space opens and closes it.
 * Pass `inLink` for counts in a link, where only a tap does, and a click
 * follows the link. Pass `open` and `onOpenChange` to also open it from
 * elsewhere, and `children` for words after the glyphs that hover, or a
 * press, opens it from too.
 */
export const Counts = ({
  shown,
  chartCount,
  getCharts,
  open = false,
  onOpenChange,
  inLink = false,
  className,
  'data-testid': testId,
  children,
}: CountsProps) => {
  // Its pointerdown handler reads the state before Radix's own closes an open
  // tooltip, and its click handler cancels the click, which also stops
  // Radix's from closing it again.
  const { isActive, setIsActive, triggerProps } = usePressToggle(
    TOGGLE_OPTIONS[inLink ? 'IN_LINK' : 'ALONE']
  )
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
  // Opened or closed from outside, it opens or closes as hover would, so a
  // press can still close it, and loads the charts as it opens too.
  useEffect(() => {
    setIsActive(open)
    if (open) {
      prefetchCharts()
    }
  }, [open, setIsActive, prefetchCharts])
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
  // What opens the tooltip, wherever they're spread.
  const openProps = {
    ...triggerProps,
    // The tooltip opens on its trigger's keyboard focus, so a tab stop is
    // all it takes. In a link, the link is the tab stop.
    tabIndex: inLink ? undefined : 0,
    // A press toggles it, so outside a link it's a button, which takes the
    // glyphs' name, as it has none of its own. In a link, a button would
    // nest in it, which a link can't hold.
    role: inLink ? undefined : 'button',
    // Starts loading the charts as the pointer arrives, ahead of the
    // tooltip's open delay, or with a tap.
    onPointerEnter: prefetchCharts,
    // The tooltip opens on keyboard focus by itself, without reporting it,
    // so its focus starts them loading too.
    onFocus: prefetchCharts,
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      prefetchCharts()
      triggerProps.onPointerDown(event)
    },
  }
  /** The glyphs, as an image, with `props`. */
  const renderGlyphs = (props?: { 'data-testid'?: string }) => (
    // An image, like the profile README's badge, so its name can be the full
    // counts rather than the shortened ones it shows.
    <span
      role="img"
      aria-label={label}
      className="flex items-center"
      {...props}>
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
  )
  return (
    <Tooltip
      open={isActive}
      onOpenChange={changeOpen}
      content={getContent()}
      aria-label={description}
      className={
        TOOLTIP_CLASSES[countsCharts || isLoading ? 'CHARTS' : 'WORDS']
      }>
      {children ? (
        // The glyphs and the words both open it.
        <span
          className={cn(
            'inline-flex items-center gap-2',
            // A press opens and closes it, as a button's would.
            'cursor-pointer',
            className
          )}
          {...openProps}>
          {renderGlyphs({ 'data-testid': testId })}
          {children}
        </span>
      ) : (
        <span
          className={cn(
            'flex items-center',
            // A press opens and closes it, as a button's would.
            'cursor-pointer',
            className
          )}
          {...openProps}
          data-testid={testId}>
          {renderGlyphs()}
        </span>
      )}
    </Tooltip>
  )
}
