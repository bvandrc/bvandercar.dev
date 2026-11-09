import { getWheelZoomFactor } from '../useZoomPanGestures'

describe('getWheelZoomFactor', () => {
  it('zooms in for a wheel turned up, and out by as much for one turned down', () => {
    expect(getWheelZoomFactor(-100)).toBeLessThan(1)
    expect(getWheelZoomFactor(-100) * getWheelZoomFactor(100)).toBeCloseTo(1)
  })
})
