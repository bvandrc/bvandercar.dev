import { getPlotScale, PLOT } from '../plot'

const SPAN = { start: '2026-03-01', end: '2026-03-11' }

describe('getPlotScale', () => {
  it("maps the span's ends to the plot's, and back", () => {
    const { toX, getTimeAtX } = getPlotScale(SPAN, 100)

    expect([toX(SPAN.start), toX(SPAN.end)]).toEqual([PLOT.INSET, PLOT.RIGHT])
    expect(getTimeAtX(PLOT.RIGHT)).toBe(Date.parse(SPAN.end))
  })

  it('maps zero to the baseline and the total to the top', () => {
    const { toY } = getPlotScale(SPAN, 100)

    expect([toY(0), toY(100)]).toEqual([PLOT.BASELINE, PLOT.TOP])
  })

  it('keeps a total of zero on the baseline, rather than dividing by zero', () => {
    const { toY } = getPlotScale(SPAN, 0)

    expect(toY(0)).toBe(PLOT.BASELINE)
  })

  it('gives a span of one day width to draw across', () => {
    const { toX } = getPlotScale({ start: SPAN.start, end: SPAN.start }, 100)

    expect(toX('2026-03-02')).toBe(PLOT.RIGHT)
  })
})
