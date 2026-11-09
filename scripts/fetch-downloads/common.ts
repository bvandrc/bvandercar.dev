import { getErrorMessage } from '../shared/errors.ts'

/** A package's downloads on one day, as both registries' fetches give them. */
export type DailyDownloads = { day: string; downloads: number }

/** A release: its version, and the ISO date it was published. */
export type Release = { version: string; day: string }

/** Sorts releases oldest first. */
export const byDay = (a: Release, b: Release) => a.day.localeCompare(b.day)

/** What a registry's fetch read: each package's downloads per day, and each one's releases, for the packages it could. */
export type RegistryHistory = {
  downloads: { pkg: string; days: DailyDownloads[] }[]
  releases: { pkg: string; releases: Release[] }[]
}

/** Warns that `what` couldn't be read, so its glyph keeps the profile's count, rather than failing the build over a stats outage. */
export const warnSkipped = (what: string, error: unknown) =>
  console.warn(
    `::warning::${what} could not be read, so its glyph keeps the profile's count: ${getErrorMessage(error)}`
  )
