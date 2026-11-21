import type { Release, VersionDownloads } from '../../shared/counts.ts'

/** A package's downloads on one day, as both registries' fetches give them. */
export type DailyDownloads = { day: string; downloads: number }

/** Sorts releases oldest first. */
export const byDay = (a: Release, b: Release) => a.day.localeCompare(b.day)

/**
 * What a registry's fetch read: each package's downloads per day, and its
 * releases, for the packages it could.
 *
 * `versions` totals the days by minor version, like "4.0", over each of
 * `CHART_PERIOD_DAYS`, where the registry gives each version's whole
 * history; npm's gives only the last week.
 */
export type RegistryHistory = {
  pkg: string
  days: DailyDownloads[]
  versions?: VersionDownloads
  releases: Release[]
}[]
