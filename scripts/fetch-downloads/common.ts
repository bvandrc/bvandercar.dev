/** A package's downloads on one day, as both registries' fetches give them. */
export type DailyDownloads = { day: string; downloads: number }

/** A release: its version, and the ISO date it was published. */
export type Release = { version: string; day: string }

/** Sorts releases oldest first. */
export const byDay = (a: Release, b: Release) => a.day.localeCompare(b.day)

/** What a registry's fetch read: each package's downloads per day, and its releases, for the packages it could. */
export type RegistryHistory = {
  pkg: string
  days: DailyDownloads[]
  releases: Release[]
}[]
