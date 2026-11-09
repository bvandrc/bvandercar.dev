/** A day's length, in milliseconds. */
export const DAY_MS = 24 * 60 * 60 * 1000

/** A time's UTC calendar day, as an ISO date: `'2026-03-02'`. */
export const isoDate = (time: number) =>
  new Date(time).toISOString().slice(0, 10)

/** The ISO date `days` after `day`, or before it for a negative count. */
export const addDays = (day: string, days: number) =>
  isoDate(Date.parse(day) + days * DAY_MS)

/** How many days `day` is after `from`, or before it for a negative count. */
export const getDaysBetween = (from: string, day: string) =>
  Math.round((Date.parse(day) - Date.parse(from)) / DAY_MS)

/** The earlier of two ISO dates, which sort as strings. */
export const earlierDay = (a: string, b: string) => (a < b ? a : b)

/** The later of two ISO dates. */
export const laterDay = (a: string, b: string) => (a > b ? a : b)

/** Every ISO date from `first` through `last`, oldest first. */
export const listDays = (first: string, last: string) => {
  const days: string[] = []
  for (let time = Date.parse(first); time <= Date.parse(last); time += DAY_MS) {
    days.push(isoDate(time))
  }
  return days
}

/**
 * The days from `first` through `last` in stretches of `days` days, oldest
 * first, as the ISO dates each runs from and to.
 *
 * The last stretch ends on `last`, so it can be short.
 */
export const listWindows = (first: string, last: string, days: number) => {
  const windows: { from: string; to: string }[] = []
  for (let from = first; from <= last; from = addDays(from, days)) {
    windows.push({ from, to: earlierDay(addDays(from, days - 1), last) })
  }
  return windows
}
