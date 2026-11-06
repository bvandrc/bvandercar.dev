// Compact past 999, to one decimal place at most: 1070 → 1.1K, 70315 → 70.3K.
const COUNT_FORMAT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** `formatCount(1, 'PR')` → `'1 PR'`, `formatCount(43649, 'download')` → `'43.6K downloads'`. */
export const formatCount = (count: number, noun: string) =>
  `${COUNT_FORMAT.format(count)} ${count === 1 ? noun : `${noun}s`}`
