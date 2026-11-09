import { DAY_MS } from '~/dates'
import type { DaySpan } from './spans'

// As wide as fits a 375px phone screen, with the tooltip's padding and margins.
const WIDTH = 328
const HEIGHT = 84
// Keeps the 2px line and the 8px hover dot inside the box at either end.
const INSET = 5
// The strip along the top the caption sits in, which the line stays below,
// tall enough that the total beside the line's end clears the caption too.
const CAPTION_HEIGHT = 30
// Room on the right for the total, written beside the line's end, as short as
// the glyphs write it, like "70.3K".
const TOTAL_WIDTH = 46

/** A running-total chart's box, and where in it the line is drawn, in pixels. */
export const PLOT = {
  WIDTH,
  HEIGHT,
  INSET,
  CAPTION_HEIGHT,
  // Where the highest total is drawn.
  TOP: CAPTION_HEIGHT + INSET,
  // Where the last day is drawn.
  RIGHT: WIDTH - TOTAL_WIDTH,
  // Where a count of zero is drawn.
  BASELINE: HEIGHT - INSET,
} as const

/**
 * Maps `span`'s times across the plot, and counts from zero to `total` up it.
 *
 * The height runs from zero to `total` however far it's zoomed in, so a
 * height always means the same count.
 */
export const getPlotScale = ({ start, end }: DaySpan, total: number) => {
  // Compared as times, not strings: a zoomed-in span's ends are ISO times,
  // which sort after the plain ISO date of the same day.
  const startTime = Date.parse(start)
  const endTime = Date.parse(end)
  // A span of one day still has width to draw across.
  const spanTime = endTime - startTime || DAY_MS
  const plotWidth = PLOT.RIGHT - INSET
  return {
    startTime,
    endTime,
    /** How much time one pixel across the plot covers. */
    msPerPx: spanTime / plotWidth,
    /** Where an ISO date or time falls across the plot. */
    toX: (day: string) =>
      INSET + ((Date.parse(day) - startTime) / spanTime) * plotWidth,
    /** Where a count falls up the plot. */
    toY: (count: number) =>
      // A total of zero stays on the baseline rather than dividing by zero.
      PLOT.BASELINE - (count / (total || 1)) * (PLOT.BASELINE - PLOT.TOP),
    /** The time at `x` across the plot, which may fall outside the span. */
    getTimeAtX: (x: number) => startTime + ((x - INSET) / plotWidth) * spanTime,
  }
}
