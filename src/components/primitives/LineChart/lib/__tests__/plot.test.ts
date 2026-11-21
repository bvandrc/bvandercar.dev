import { getPlotScale, PLOT, type PlotDomain, type PlotRange } from '../plot'

const DOMAIN = { start: 100, end: 200 } satisfies PlotDomain
const RANGE = { low: 40, high: 100 } satisfies PlotRange

describe('getPlotScale', () => {
  it("maps the domain's ends to the plot's, and back", () => {
    const { toX, getXAt } = getPlotScale(DOMAIN, RANGE)

    expect([toX(DOMAIN.start), toX(DOMAIN.end)]).toEqual([
      PLOT.INSET,
      PLOT.RIGHT,
    ])
    expect(getXAt(PLOT.RIGHT)).toBe(DOMAIN.end)
  })

  it("maps the range's low to the baseline and its high to the top, so its rise fills the height", () => {
    const { toY } = getPlotScale(DOMAIN, RANGE)

    expect([toY(40), toY(70), toY(100)]).toEqual([
      PLOT.BASELINE,
      (PLOT.BASELINE + PLOT.TOP) / 2,
      PLOT.TOP,
    ])
  })

  it('keeps a range with no rise on the baseline, rather than dividing by zero', () => {
    const { toY } = getPlotScale(DOMAIN, { low: 40, high: 40 })

    expect(toY(40)).toBe(PLOT.BASELINE)
  })

  it('gives a domain with no width some to draw across, rather than dividing by zero', () => {
    const { toX } = getPlotScale({ start: 100, end: 100 }, RANGE)

    expect([toX(100), toX(101)]).toEqual([PLOT.INSET, PLOT.RIGHT])
  })
})
