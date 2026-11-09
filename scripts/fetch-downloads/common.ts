/** A package's downloads on one day, as both registries' fetches give them. */
export type DailyDownloads = { day: string; downloads: number }

/** What a registry's fetch read: each package's downloads per day, for the packages it could. */
export type RegistryHistory = { pkg: string; days: DailyDownloads[] }[]
