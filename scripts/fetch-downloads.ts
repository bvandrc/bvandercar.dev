/**
 * Fetches the weekly download history of each npm package the profile content
 * names, for the chart in a project's counts tooltip.
 *
 * Writes src/generated/npm-downloads.ts, gitignored. Reads the package names
 * from the content `pnpm fetch:profile` copied, so run that first. A package
 * the API can't answer for is left out with a warning, and its card shows no
 * chart, rather than failing the build over a stats outage.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'

const PROJECTS_FILE = 'src/generated/profile/content/projects.ts'
const OUT_FILE = 'src/generated/npm-downloads.ts'

/** Days per query, inside the 18 months the API answers at once. */
const WINDOW_DAYS = 365
const DAY_MS = 24 * 60 * 60 * 1000

type DailyDownloads = { day: string; downloads: number }

const isoDate = (time: number) => new Date(time).toISOString().slice(0, 10)

/** A JSON response from `url`, throwing on any non-2xx status. */
const fetchJson = async <T>(url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`${res.status} for ${url}`)
  }
  return (await res.json()) as T
}

/** A package's downloads for each day from its first publish through the last day npm has counted. */
const fetchDailyDownloads = async (pkg: string) => {
  // A scoped name's slash would otherwise read as a path segment.
  const name = pkg.replace('/', '%2F')
  const [{ time }, latest] = await Promise.all([
    fetchJson<{ time: { created: string } }>(
      `https://registry.npmjs.org/${name}`
    ),
    // The range API answers 0 for a day it hasn't counted yet, which would
    // read as a drop, so the range stops at the last day it has.
    fetchJson<{ end: string }>(
      `https://api.npmjs.org/downloads/point/last-day/${name}`
    ),
  ])
  const lastDay = Date.parse(latest.end)
  const days: DailyDownloads[] = []
  // The API caps each query's range, so an older package takes several.
  for (
    // From the start of the publish day, which a range has to begin on.
    let start = Date.parse(time.created.slice(0, 10));
    start <= lastDay;
    start += WINDOW_DAYS * DAY_MS
  ) {
    const end = Math.min(start + (WINDOW_DAYS - 1) * DAY_MS, lastDay)
    const { downloads } = await fetchJson<{ downloads: DailyDownloads[] }>(
      `https://api.npmjs.org/downloads/range/${isoDate(start)}:${isoDate(end)}/${name}`
    )
    days.push(...downloads)
  }
  return days
}

/**
 * Daily downloads summed into weeks that end on the last day.
 *
 * Counting back from the last day keeps the latest week whole, so it never
 * reads as a drop; the week of the first publish is the one left short.
 */
const sumWeeks = (days: DailyDownloads[]) => {
  const weekly: number[] = []
  for (let end = days.length; end > 0; end -= 7) {
    const week = days.slice(Math.max(0, end - 7), end)
    weekly.unshift(week.reduce((sum, { downloads }) => sum + downloads, 0))
  }
  return weekly
}

const projects = await readFile(PROJECTS_FILE, 'utf8')
const packages = [...projects.matchAll(/npmPackage:\s*'([^']+)'/g)]
  .map(([, pkg]) => pkg)
  .sort()

const entries: string[] = []
for (const pkg of packages) {
  try {
    const days = await fetchDailyDownloads(pkg)
    const firstDay = days.at(0)?.day
    const lastDay = days.at(-1)?.day
    if (firstDay && lastDay) {
      entries.push(
        `  '${pkg}': { firstDay: '${firstDay}', lastDay: '${lastDay}', weekly: [${sumWeeks(days).join(', ')}] },`
      )
    }
  } catch (error) {
    console.warn(
      `::warning::npm downloads for ${pkg} could not be read, so its card shows no chart: ${error instanceof Error ? error.message : error}`
    )
  }
}

await mkdir('src/generated', { recursive: true })
await writeFile(
  OUT_FILE,
  `// GENERATED FILE — do not edit directly. Run \`pnpm fetch:downloads\`.

export type WeeklyDownloads = {
  /** ISO date of the first day counted, the package's first publish */
  firstDay: string
  /** ISO date of the last day counted, the end of the last week */
  lastDay: string
  /** Downloads in each 7-day week ending on \`lastDay\`, oldest first; the first can be shorter */
  weekly: number[]
}

/** Each npm package's weekly downloads since its first publish, keyed by package name. */
export const NPM_DOWNLOADS: Record<string, WeeklyDownloads | undefined> = {
${entries.join('\n')}
}
`
)
console.log(
  `npm downloads: ${entries.length} of ${packages.length} packages' weekly history`
)
