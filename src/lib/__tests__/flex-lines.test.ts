import {
  buildItemRects,
  buildItemTestId,
  type ItemLayout,
  mockRects,
} from '@/test-helpers/layout'
import { measureFlexLines } from '../flex-lines'

/** Appends a box holding `count` items, each with its test id, to the page. */
const createBox = (count: number) => {
  const box = document.createElement('div')
  for (let index = 0; index < count; index++) {
    const item = document.createElement('span')
    item.dataset.testid = buildItemTestId(index)
    box.append(item)
  }
  document.body.append(box)
  return box
}

// Two items on a line 120px wide, then one 40px wide wrapped below them.
const WRAPPED: ItemLayout[] = [
  { line: 0, left: 0, right: 50 },
  { line: 0, left: 56, right: 120 },
  { line: 1, left: 0, right: 40 },
]

describe('measureFlexLines', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.replaceChildren()
  })

  it('groups the items by the line they sit on, with each line’s edges', () => {
    mockRects(buildItemRects(WRAPPED))
    const box = createBox(3)
    const [first, second, third] = box.children
    expect(measureFlexLines(box)).toMatchObject([
      { items: [first, second], left: 0, right: 120 },
      { items: [third], left: 0, right: 40 },
    ])
  })

  it('leaves out a child that is not an HTML element', () => {
    mockRects(buildItemRects(WRAPPED))
    const box = createBox(3)
    box.prepend(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
    expect(measureFlexLines(box).flatMap(({ items }) => items)).toHaveLength(3)
  })

  it('finds no lines in an empty box', () => {
    expect(measureFlexLines(createBox(0))).toEqual([])
  })
})
