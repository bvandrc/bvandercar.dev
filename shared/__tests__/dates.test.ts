import { listDays, listWindows } from '../dates'

describe('listDays', () => {
  it('lists every day from the first through the last', () => {
    expect(listDays('2026-02-27', '2026-03-02')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ])
  })
})

describe('listWindows', () => {
  it('splits the days into stretches of the given length, the last ending on the last day', () => {
    expect(listWindows('2026-02-26', '2026-03-05', 3)).toEqual([
      { from: '2026-02-26', to: '2026-02-28' },
      { from: '2026-03-01', to: '2026-03-03' },
      { from: '2026-03-04', to: '2026-03-05' },
    ])
  })

  it('gives one day a stretch of its own', () => {
    expect(listWindows('2026-03-05', '2026-03-05', 3)).toEqual([
      { from: '2026-03-05', to: '2026-03-05' },
    ])
  })
})
