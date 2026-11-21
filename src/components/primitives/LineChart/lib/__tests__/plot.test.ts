import {
  getPlotScale,
  PLOT,
  type PlotDomain,
  type PlotRange,
  type PlotSize,
} from '../plot'

const DOMAIN = { x1: 100, x2: 200 } satisfies PlotDomain
const RANGE = { y1: 40, y2: 100 } satisfies PlotRange
const SIZE = { width: 300, height: 80 } satisfies PlotSize

describe('getPlotScale', () => {
  it("maps the domain's ends to the plot's, leaving room for the end label, and back", () => {
    const { toX, getXAt, right } = getPlotScale(DOMAIN, RANGE, SIZE)

    expect(right).toBe(SIZE.width - PLOT.END_LABEL_WIDTH)
    expect([toX(DOMAIN.x1), toX(DOMAIN.x2)]).toEqual([PLOT.INSET, right])
    expect(getXAt(right)).toBe(DOMAIN.x2)
  })

  it("maps the range's y1 to the baseline and its y2 to the top, so its rise fills the height", () => {
    const { toY, baseline } = getPlotScale(DOMAIN, RANGE, SIZE)

    expect(baseline).toBe(SIZE.height - PLOT.INSET)
    expect([toY(40), toY(70), toY(100)]).toEqual([
      baseline,
      (baseline + PLOT.TOP) / 2,
      PLOT.TOP,
    ])
  })

  it('keeps a range with no rise on the baseline, rather than dividing by zero', () => {
    const { toY, baseline } = getPlotScale(DOMAIN, { y1: 40, y2: 40 }, SIZE)

    expect(toY(40)).toBe(baseline)
  })

  it('gives a domain with no width some to draw across, rather than dividing by zero', () => {
    const { toX, right } = getPlotScale({ x1: 100, x2: 100 }, RANGE, SIZE)

    expect([toX(100), toX(101)]).toEqual([PLOT.INSET, right])
  })
})
