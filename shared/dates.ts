/** A day's length, in milliseconds. */
export const DAY_MS = 24 * 60 * 60 * 1000

/** A time's UTC calendar day, as an ISO date: `'2026-03-02'`. */
export const isoDate = (time: number) =>
  new Date(time).toISOString().slice(0, 10)

/** The ISO date `days` after `day`, or before it for a negative count. */
export const addDays = (day: string, days: number) =>
  isoDate(Date.parse(day) + days * DAY_MS)

/** The earlier of two ISO dates, which sort as strings. */
export const earlierDay = (a: string, b: string) => [a, b].sort()[0]

/** The later of two ISO dates. */
export const laterDay = (a: string, b: string) => [a, b].sort()[1]

/** Every ISO date from `first` through `last`, oldest first. */
export const listDays = (first: string, last: string) => {
  const days: string[] = []
  for (let time = Date.parse(first); time <= Date.parse(last); time += DAY_MS) {
    days.push(isoDate(time))
  }
  return days
}
