import { getPlotScale, PLOT, type PlotRange } from '../plot'

const SPAN = { start: '2026-03-01', end: '2026-03-11' }
const RANGE = { low: 40, high: 100 } satisfies PlotRange

describe('getPlotScale', () => {
  it("maps the span's ends to the plot's, and back", () => {
    const { toX, getTimeAtX } = getPlotScale(SPAN, RANGE)

    expect([toX(SPAN.start), toX(SPAN.end)]).toEqual([PLOT.INSET, PLOT.RIGHT])
    expect(getTimeAtX(PLOT.RIGHT)).toBe(Date.parse(SPAN.end))
  })

  it("maps the range's low to the baseline and its high to the top, so its rise fills the height", () => {
    const { toY } = getPlotScale(SPAN, RANGE)

    expect([toY(40), toY(70), toY(100)]).toEqual([
      PLOT.BASELINE,
      (PLOT.BASELINE + PLOT.TOP) / 2,
      PLOT.TOP,
    ])
  })

  it('keeps a range with no rise on the baseline, rather than dividing by zero', () => {
    const { toY } = getPlotScale(SPAN, { low: 40, high: 40 })

    expect(toY(40)).toBe(PLOT.BASELINE)
  })

  it('gives a span of one day width to draw across', () => {
    const { toX } = getPlotScale({ start: SPAN.start, end: SPAN.start }, RANGE)

    expect(toX('2026-03-02')).toBe(PLOT.RIGHT)
  })
})
