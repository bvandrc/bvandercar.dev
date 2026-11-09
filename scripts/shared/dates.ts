import { DAY_MS } from './constants.ts'

/** A time's UTC calendar day, as an ISO date: `'2026-03-02'`. */
export const isoDate = (time: number) =>
  new Date(time).toISOString().slice(0, 10)

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
