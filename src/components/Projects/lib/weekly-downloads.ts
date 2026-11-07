import type { Registry, WeeklyDownloads } from '@/generated/package-downloads'
import { addDays, formatDay, formatMonth, getPeakWeek } from './weeks'

/** Each registry's name, as written in a sentence. */
export const REGISTRY_NAMES = {
  npm: 'npm',
  pypi: 'PyPI',
} as const satisfies Record<Registry, string>

/** The ISO date each of the history's weeks starts on, oldest first. */
export const getDownloadWeekStarts = ({
  firstDay,
  lastDay,
  weekly,
}: WeeklyDownloads) =>
  weekly.map((_, index) => {
    const start = addDays(lastDay, -((weekly.length - 1 - index) * 7 + 6))
    // The first week can be short, starting on the first publish instead.
    return start < firstDay ? firstDay : start
  })

/** The history in a sentence, like "Weekly npm downloads since Jul 2026, peaking at 1,010 in the week of Jul 28, 2026". */
export const describeWeeklyDownloads = (
  history: WeeklyDownloads,
  registry: Registry
) => {
  const peak = getPeakWeek(history.weekly, getDownloadWeekStarts(history))
  return `Weekly ${REGISTRY_NAMES[registry]} downloads since ${formatMonth(history.firstDay)}, peaking at ${peak.count.toLocaleString('en-US')} in the week of ${formatDay(peak.start)}`
}
