// Compact past 999, to one decimal place at most: 1070 → 1.1K, 70315 → 70.3K.
const COMPACT_FORMAT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** A count shortened to fit a tight space: `654` → `'654'`, `43649` → `'43.6K'`. */
export const formatCompactCount = (count: number) =>
  COMPACT_FORMAT.format(count)

/** A count in full with its noun: `formatCount(1, 'PR')` → `'1 PR'`, `formatCount(3120, 'download')` → `'3,120 downloads'`. */
export const formatCount = (count: number, noun: string) =>
  `${count.toLocaleString('en-US')} ${count === 1 ? noun : `${noun}s`}`
