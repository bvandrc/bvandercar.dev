import type { DownloadHistory, Registry } from '~/counts'
import { getDaysBetween, listDays } from '~/dates'
import { describeWeekly, sumWeeks } from './weeks'

/** Each registry's name, as written in a sentence. */
export const REGISTRY_NAMES = {
  npm: 'npm',
  pypi: 'PyPI',
} as const satisfies Record<Registry, string>

/**
 * The ISO date each of the history's weeks ends on, oldest first, 7 days
 * apart, the last on its last day.
 *
 * Counting back from the last day keeps the latest week whole, so it never
 * reads as a drop; the week of the first publish is the one left short.
 */
export const getDownloadWeekEnds = ({ firstDay, lastDay }: DownloadHistory) =>
  listDays(firstDay, lastDay).filter(
    (day) => getDaysBetween(day, lastDay) % 7 === 0
  )

/** The history's downloads in each of its weeks. */
export const getDownloadWeeks = (history: DownloadHistory) =>
  sumWeeks(history.firstDay, history.daily, getDownloadWeekEnds(history))

/**
 * The history in a sentence, like "Weekly npm downloads since Jul 2026,
 * peaking at 1,010 in the week of Jul 28, 2026".
 *
 * Without a registry, for downloads from more than one, it names none.
 */
export const describeWeeklyDownloads = (
  history: DownloadHistory,
  registry: Registry | undefined
) =>
  describeWeekly(
    registry ? `${REGISTRY_NAMES[registry]} downloads` : 'downloads',
    history.firstDay,
    getDownloadWeeks(history)
  )
