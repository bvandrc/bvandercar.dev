import { getErrorMessage } from '../shared/errors.ts'

/** A package's downloads on one day, as both registries' fetches give them. */
export type DailyDownloads = { day: string; downloads: number }

/** What a registry's fetch read: each package's downloads per day, for the packages it could. */
export type RegistryHistory = { pkg: string; days: DailyDownloads[] }[]

/** Warns that `what` couldn't be read, so its glyph keeps the profile's count, rather than failing the build over a stats outage. */
export const warnSkipped = (what: string, error: unknown) =>
  console.warn(
    `::warning::${what} could not be read, so its glyph keeps the profile's count: ${getErrorMessage(error)}`
  )
