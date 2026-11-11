const LINE_HEIGHT = 20
const LINE_GAP = 6

/** Where an item in a wrapping flex box sits: its line, counting from 0, and its left and right edges. */
export type ItemLayout = { line: number; left: number; right: number }

/** The rect an item at `layout` measures, each line 20px tall with 6px between. */
export const buildItemRect = ({ line, left, right }: ItemLayout) =>
  new DOMRect(left, line * (LINE_HEIGHT + LINE_GAP), right - left, LINE_HEIGHT)

/** The test id of the item at `index` in a flex box a test lays out. */
export const buildItemTestId = (index: number) => `item-${index}`

/** The rects of items at `layouts`, by their test ids, for `mockRects`. */
export const buildItemRects = (layouts: ItemLayout[]) =>
  Object.fromEntries(
    layouts.map((layout, index) => [
      buildItemTestId(index),
      buildItemRect(layout),
    ])
  )

/**
 * Makes each element whose test id `rects` names measure as that rect, and
 * every other element as empty, until called again.
 */
export const mockRects = (rects: Record<string, DOMRect>) =>
  vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      return rects[this.dataset.testid ?? ''] ?? new DOMRect()
    })
