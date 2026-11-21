import { useId, useMemo, useRef } from 'react'
import { clamp } from 'es-toolkit'

import { Icon } from '@/components/primitives/Icon'
import { cn } from '@/lib/cn'
import type { GlyphName } from '@/lib/icons'
import { usePlotInput } from './hooks/usePlotInput'
import { getPlotScale, PLOT, type PlotDomain, type PlotRange } from './lib/plot'

/** A point the line runs through. */
export type LineChartPoint = { x: number; y: number }

/** What the pointer is over on a line chart. */
export type LineChartHover = {
  /** Where it is along the plot, kept between the line's start and the domain's end */
  x: number
  /** The marker it's snapped to, if any */
  marker?: number
}

// A grab cursor while there's somewhere to drag the chart to.
const PLOT_CURSOR_CLASSES = {
  FIXED: '',
  PANNABLE: 'cursor-grab active:cursor-grabbing',
} as const

// A hovered marker's line stands out from the rest.
const MARKER_CLASSES = {
  IDLE: 'stroke-ink-muted/30',
  ACTIVE: 'stroke-ink-muted',
} as const

// How near a marker the pointer snaps to it, in pixels.
const MARKER_SNAP_PX = 4

export type LineChartProps = {
  /** The points the line runs through, left to right; two or more */
  points: LineChartPoint[]
  /** The x values its width runs from and to, past which the line is cropped */
  domain: PlotDomain
  /** The y values its height runs from, on the baseline, to, at the top */
  range: PlotRange
  /** A text color class, like `text-commits`, that the line, its shading, and the hover dot are drawn in */
  colorClassName: string
  /** The x values to draw a grey line down the plot at, like each release's day; those outside `domain` are left out */
  markers?: number[]
  /** The caption for what the pointer is over, or for nothing, while it's off the plot */
  renderCaption: (hover: LineChartHover | undefined) => React.ReactNode
  /** The glyph in front of the caption */
  icon?: GlyphName
  /** The point read out at `x` off a marker, which a dot and a line down the plot mark; none without it */
  getHoverPoint?: (x: number) => LineChartPoint | undefined
  /** Written beside the line's end, like its last value, while that's in view */
  endLabel?: React.ReactNode
  /** Written smaller, under `endLabel` */
  endNote?: React.ReactNode
  /** Whether a mouse drag moves it along, as while zoomed in, which takes `onPan` too */
  pannable?: boolean
  /** Called for a wheel turned, or a pinch, over the plot, with the x value under it and how much to scale `domain`'s width, to zoom around it; without it, the page scrolls and zooms as usual */
  onZoom?: (anchor: number, factor: number) => void
  /** Called for a drag, a sideways scroll, or two fingers moved, over the plot, with how much later along x to move `domain` */
  onPan?: (delta: number) => void
  'data-testid'?: string
}

type HoverMarkerProps = {
  /** Where the hovered point falls across the plot */
  x: number
  /** Where it falls up the plot */
  y: number
}

/** The hovered point's line down the plot, with a dot where it meets the line. */
const HoverMarker = ({ x, y }: HoverMarkerProps) => (
  <>
    <line
      x1={x}
      x2={x}
      y1={PLOT.CAPTION_HEIGHT}
      y2={PLOT.BASELINE}
      className="stroke-ink-muted/50"
    />
    <circle
      cx={x}
      cy={y}
      r={4}
      fill="currentColor"
      strokeWidth={2}
      // A ring in the tooltip's own color, so the dot stands off the line.
      className="stroke-surface-raised"
      data-testid="line-chart-dot"
    />
  </>
)

/**
 * A small shaded line chart, captioned in its top-left corner, with a label
 * beside the line's end.
 *
 * The caption follows the pointer, which snaps to a marker within a few
 * pixels of it, and a wheel, pinch, or drag zooms and pans it through
 * `onZoom` and `onPan`. Drawn for sighted pointer users only: pair it with
 * its values in words for everyone else.
 */
export const LineChart = ({
  points,
  domain,
  range,
  colorClassName,
  markers = [],
  renderCaption,
  icon,
  getHoverPoint,
  endLabel,
  endNote,
  pannable = false,
  onZoom,
  onPan,
  'data-testid': testId,
}: LineChartProps) => {
  const plotRef = useRef<SVGSVGElement>(null)
  // An id is only for the clip path's url(), where colons don't belong.
  const clipId = `plot-${useId().replaceAll(':', '')}`
  // Worked out again only when the points or the plot's bounds change, not on
  // each render, as a pointer moving over the chart makes.
  const { start, end } = domain
  const { low, high } = range
  const { scale, line } = useMemo(() => {
    const plotScale = getPlotScale({ start, end }, { low, high })
    const { toX, toY } = plotScale
    return {
      scale: plotScale,
      line: points
        .map(({ x, y }, index) => `${index ? 'L' : 'M'}${toX(x)},${toY(y)}`)
        .join(''),
    }
  }, [points, start, end, low, high])
  const { toX, toY, xPerPx, getXAt } = scale
  // It has two points or more, so a first and a last.
  const first = points[0] ?? { x: start, y: low }
  const last = points.at(-1) ?? first
  /** The x value at `px` across the plot, kept between the line's start and the domain's end, so it never falls where there's no line. */
  const getShownXAt = (px: number) => clamp(getXAt(px), first.x, end)
  const shownMarkers = markers.filter((x) => x >= start && x <= end)
  // Where the pointer is across the plot, rather than the point under it, so
  // a zoom or pan that slides the line beneath a still pointer reads out
  // what it's over now.
  const { pointerX, pointerProps } = usePlotInput(plotRef, {
    getXAt: getShownXAt,
    valuePerPx: xPerPx,
    onZoom,
    onPan,
  })
  const hover =
    pointerX === undefined
      ? undefined
      : {
          x: getShownXAt(pointerX),
          marker: shownMarkers.find(
            (x) => Math.abs(toX(x) - pointerX) <= MARKER_SNAP_PX
          ),
        }
  const hoverPoint =
    hover && hover.marker === undefined ? getHoverPoint?.(hover.x) : undefined
  const startX = toX(first.x)
  const lastX = toX(last.x)
  return (
    <div className="relative" data-testid={testId}>
      <svg
        ref={plotRef}
        aria-hidden
        width={PLOT.WIDTH}
        height={PLOT.HEIGHT}
        viewBox={`0 0 ${PLOT.WIDTH} ${PLOT.HEIGHT}`}
        className={cn(
          'overflow-visible',
          // A finger dragged across it moves the readout, not the page.
          'touch-none',
          // A mouse drags a zoomed-in chart along.
          PLOT_CURSOR_CLASSES[pannable && onPan ? 'PANNABLE' : 'FIXED'],
          colorClassName
        )}
        {...pointerProps}
        data-testid="line-chart-plot">
        <defs>
          {/* Crops a zoomed-in line at the plot's edges. */}
          <clipPath id={clipId}>
            <rect width={PLOT.RIGHT + PLOT.INSET} height={PLOT.HEIGHT} />
          </clipPath>
        </defs>
        <line
          x1={PLOT.INSET}
          x2={PLOT.RIGHT}
          y1={PLOT.BASELINE}
          y2={PLOT.BASELINE}
          className="stroke-ink-muted/30"
        />
        {shownMarkers.map((x) => (
          <line
            key={x}
            x1={toX(x)}
            x2={toX(x)}
            y1={PLOT.CAPTION_HEIGHT}
            y2={PLOT.BASELINE}
            className={MARKER_CLASSES[x === hover?.marker ? 'ACTIVE' : 'IDLE']}
            data-testid="line-chart-marker"
          />
        ))}
        <path
          d={`${line}L${lastX},${PLOT.BASELINE}L${startX},${PLOT.BASELINE}Z`}
          fill="currentColor"
          fillOpacity={0.1}
          clipPath={`url(#${clipId})`}
        />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          clipPath={`url(#${clipId})`}
          data-testid="line-chart-line"
        />
        {/* Only while the line's end is in view, unless zoomed in short of it. */}
        {last.x <= end && (
          <>
            {endLabel !== undefined && (
              <text
                x={lastX + 6}
                // Centred on the line's end, about a third of the text's height down.
                y={toY(last.y) + 5}
                className="fill-ink text-sm font-bold"
                data-testid="line-chart-end-label">
                {endLabel}
              </text>
            )}
            {endNote !== undefined && (
              <text
                x={lastX + 6}
                y={toY(last.y) + 20}
                className="fill-ink-muted text-xs"
                data-testid="line-chart-end-note">
                {endNote}
              </text>
            )}
          </>
        )}
        {hoverPoint && (
          <HoverMarker x={toX(hoverPoint.x)} y={toY(hoverPoint.y)} />
        )}
        {/* The hover target: the whole box, not just the thin line. */}
        <rect width={PLOT.WIDTH} height={PLOT.HEIGHT} fill="transparent" />
      </svg>
      <p
        className={cn(
          'flex items-center gap-1.5 whitespace-nowrap text-ink',
          // Held in the top-left corner, over the strip the line leaves
          // clear, and letting the pointer through to the plot beneath.
          'pointer-events-none absolute top-0 left-0'
        )}
        data-testid="line-chart-caption">
        {icon && <Icon name={icon} className="size-[1.1em] shrink-0" />}
        {renderCaption(hover)}
      </p>
    </div>
  )
}
