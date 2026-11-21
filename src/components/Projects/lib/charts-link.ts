import type { UrlHashTarget } from '@bvandrc/react-toolkit'

/** The `#`'s parameter that opens its card's counts' charts, as in `/#task-rankr?show_charts=true`. */
const CHARTS_PARAM = 'show_charts'

/** Whether a URL's `#` target asks for its card's counts' charts. */
export const asksForCharts = (target: UrlHashTarget) =>
  target.params.get(CHARTS_PARAM) === 'true'

/** The id of a card's title row, its name and counts, from the card's own. */
export const getCardTitleId = (cardId: string) => `${cardId}-title`

/**
 * Jumps to a URL's `#` target, for `useUrlHashTarget`.
 *
 * Where it asks for a card's charts, it centers the card's title, so their
 * tooltip has room to open above the counts; anything else lands at its top.
 */
export const scrollToUrlTarget = (
  element: HTMLElement,
  target: UrlHashTarget
) => {
  const title = asksForCharts(target)
    ? document.getElementById(getCardTitleId(target.id))
    : null
  if (title) {
    title.scrollIntoView({ behavior: 'instant', block: 'center' })
    return
  }
  element.scrollIntoView({ behavior: 'instant' })
}
