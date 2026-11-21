// As wide as fits a 375px phone screen, with the tooltip's padding and margins.
const WIDTH = 328
const HEIGHT = 84
// Keeps the 2px line and the 8px hover dot inside the box at either end.
const INSET = 5
// The strip along the top the caption sits in, which the line stays below,
// tall enough that the label beside the line's end clears the caption too.
const CAPTION_HEIGHT = 30
// Room on the right for the label written beside the line's end, as short as
// the glyphs write a count, like "70.3K".
const END_LABEL_WIDTH = 46

/** A line chart's box, and where in it the line is drawn, in pixels. */
export const PLOT = {
  WIDTH,
  HEIGHT,
  INSET,
  CAPTION_HEIGHT,
  // Where the range's high is drawn.
  TOP: CAPTION_HEIGHT + INSET,
  // Where the domain's end is drawn.
  RIGHT: WIDTH - END_LABEL_WIDTH,
  // Where the range's low is drawn.
  BASELINE: HEIGHT - INSET,
} as const

/** The x values a plot's width runs between: `start` at its left, `end` at its right. */
export type PlotDomain = { start: number; end: number }

/** The y values a plot's height runs between: `low` on its baseline, `high` at its top. */
export type PlotRange = { low: number; high: number }

/**
 * Maps x values from `domain`'s start to its end across the plot, and y
 * values from `range`'s low to its high up it.
 *
 * Give it the values at the shown stretch's ends, so its rise fills the
 * height however far it's zoomed in.
 */
export const getPlotScale = (
  { start, end }: PlotDomain,
  { low, high }: PlotRange
) => {
  // A domain with no width still has some to draw across, rather than
  // dividing by zero.
  const width = end - start || 1
  const plotWidth = PLOT.RIGHT - INSET
  return {
    /** How much of x one pixel across the plot covers. */
    xPerPx: width / plotWidth,
    /** Where an x value falls across the plot. */
    toX: (x: number) => INSET + ((x - start) / width) * plotWidth,
    /** Where a y value falls up the plot. */
    toY: (y: number) =>
      // A range with no rise stays on the baseline rather than dividing by zero.
      PLOT.BASELINE -
      ((y - low) / (high - low || 1)) * (PLOT.BASELINE - PLOT.TOP),
    /** The x value at `px` pixels across the plot, which may fall outside the domain. */
    getXAt: (px: number) => start + ((px - INSET) / plotWidth) * width,
  }
}
