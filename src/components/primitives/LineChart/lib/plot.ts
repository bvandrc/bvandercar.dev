// Keeps the 2px line and the 8px hover dot inside the box at either end.
const INSET = 5
// The strip along the top the caption sits in, which the line stays below,
// tall enough that the label beside the line's end clears the caption too.
const CAPTION_HEIGHT = 30
// Room on the right for the label written beside the line's end, as short as
// the glyphs write a count, like "70.3K".
const END_LABEL_WIDTH = 46

/** Where a line chart's line is drawn in its box, whatever its size, in pixels. */
export const PLOT = {
  INSET,
  CAPTION_HEIGHT,
  END_LABEL_WIDTH,
  // Where the range's `y2` is drawn.
  TOP: CAPTION_HEIGHT + INSET,
} as const

/** A line chart's box, in pixels. */
export type PlotSize = {
  /** Its width, the room for the label beside the line's end included */
  width: number
  height: number
}

/** The x values a plot's width runs between: `x1` at its left, `x2` at its right. */
export type PlotDomain = { x1: number; x2: number }

/** The y values a plot's height runs between: `y1` on its baseline, `y2` at its top. */
export type PlotRange = { y1: number; y2: number }

/**
 * Maps x values from `domain`'s `x1` to its `x2` across a plot of `size`, and
 * y values from `range`'s `y1` to its `y2` up it.
 *
 * Give it the values at the shown stretch's ends, so its rise fills the
 * height however far it's zoomed in.
 */
export const getPlotScale = (
  { x1, x2 }: PlotDomain,
  { y1, y2 }: PlotRange,
  { width, height }: PlotSize
) => {
  const right = width - END_LABEL_WIDTH
  const baseline = height - INSET
  // A domain with no width still has some to draw across, rather than
  // dividing by zero.
  const domainWidth = x2 - x1 || 1
  const plotWidth = right - INSET
  return {
    /** Where `x2` is drawn, the label beside the line's end to its right. */
    right,
    /** Where `y1` is drawn. */
    baseline,
    /** How much of x one pixel across the plot covers. */
    xPerPx: domainWidth / plotWidth,
    /** Where an x value falls across the plot. */
    toX: (x: number) => INSET + ((x - x1) / domainWidth) * plotWidth,
    /** Where a y value falls up the plot. */
    toY: (y: number) =>
      // A range with no rise stays on the baseline rather than dividing by zero.
      baseline - ((y - y1) / (y2 - y1 || 1)) * (baseline - PLOT.TOP),
    /** The x value at `px` pixels across the plot, which may fall outside the domain. */
    getXAt: (px: number) => x1 + ((px - INSET) / plotWidth) * domainWidth,
  }
}
