import type { UrlHashTarget } from '@bvandrc/react-toolkit'

import { getCardTitleId, scrollToUrlTarget } from '../charts-link'

const CARD_ID = 'task-rankr'

/** A `#` target for `CARD_ID`, with `query`'s parameters. */
const buildTarget = (query: string) =>
  ({
    id: CARD_ID,
    params: new URLSearchParams(query),
  }) satisfies UrlHashTarget

/** Puts an element with `id` on the page, and returns it with its mocked `scrollIntoView`. */
const createElement = (id: string) => {
  const element = document.createElement('div')
  element.id = id
  document.body.append(element)
  const scrollIntoView = vi.fn()
  element.scrollIntoView = scrollIntoView
  return { element, scrollIntoView }
}

describe('scrollToUrlTarget', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it("centers the card's title where the target asks for its charts, leaving their tooltip room above it", () => {
    const card = createElement(CARD_ID)
    const title = createElement(getCardTitleId(CARD_ID))

    scrollToUrlTarget(card.element, buildTarget('show_charts=true'))
    expect(title.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'instant',
      block: 'center',
    })
    expect(card.scrollIntoView).not.toHaveBeenCalled()
  })

  it('lands anything else at its top: a target not asking, or one with no card title, like a section', () => {
    const CASES = [
      { query: '', hasTitle: true },
      { query: 'show_charts=true', hasTitle: false },
    ]
    for (const { query, hasTitle } of CASES) {
      const card = createElement(CARD_ID)
      const title = hasTitle
        ? createElement(getCardTitleId(CARD_ID))
        : undefined

      scrollToUrlTarget(card.element, buildTarget(query))
      expect(card.scrollIntoView, query).toHaveBeenCalledWith({
        behavior: 'instant',
      })
      if (title) {
        expect(title.scrollIntoView, query).not.toHaveBeenCalled()
      }
      document.body.replaceChildren()
    }
  })
})
