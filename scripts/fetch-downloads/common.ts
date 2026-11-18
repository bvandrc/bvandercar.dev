import type { Release } from '../../shared/counts.ts'

/** A package's downloads on one day, as both registries' fetches give them. */
export type DailyDownloads = { day: string; downloads: number }

/** Sorts releases oldest first. */
export const byDay = (a: Release, b: Release) => a.day.localeCompare(b.day)

/**
 * What a registry's fetch read: each package's downloads per day, and its
 * releases, for the packages it could.
 *
 * `versions` splits the days by version, from each one's first download,
 * where the registry gives its whole history; npm's gives only the last week.
 */
export type RegistryHistory = {
  pkg: string
  days: DailyDownloads[]
  versions?: Record<string, DailyDownloads[]>
  releases: Release[]
}[]
