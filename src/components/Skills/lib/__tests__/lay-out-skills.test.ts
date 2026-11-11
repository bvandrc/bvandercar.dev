import {
  buildItemRect,
  type ItemLayout,
  mockRects,
} from '@/test-helpers/layout'
import { layOutSkills } from '../lay-out-skills'

const AREA_TEST_ID = 'area'
const LIST_TEST_ID = 'list'

/** A row as laid out: its label text's edges, and its badges' places. */
type RowLayout = {
  text: { left: number; right: number }
  badges: ItemLayout[]
}

const buildLabelTestId = (row: number) => `label-${row}`
const buildTextTestId = (row: number) => `text-${row}`
const buildSkillsTestId = (row: number) => `skills-${row}`
const buildBadgeTestId = (row: number, badge: number) => `badge-${row}-${badge}`

// A parent 600px wide, centered at 300, and every row's skills' column from
// 100 to 500.
const AREA = new DOMRect(0, 0, 600, 400)
const SKILLS = new DOMRect(100, 0, 400, 100)

/** Appends a parent holding a list of rows with `badgeCounts` badges each, to the page. */
const createList = (badgeCounts: number[]) => {
  const area = document.createElement('div')
  area.dataset.testid = AREA_TEST_ID
  const list = document.createElement('dl')
  list.dataset.testid = LIST_TEST_ID
  badgeCounts.forEach((count, row) => {
    const label = document.createElement('dt')
    label.dataset.testid = buildLabelTestId(row)
    const text = document.createElement('span')
    text.dataset.testid = buildTextTestId(row)
    label.append(text)
    const skills = document.createElement('dd')
    skills.dataset.testid = buildSkillsTestId(row)
    for (let badge = 0; badge < count; badge++) {
      const item = document.createElement('span')
      item.dataset.testid = buildBadgeTestId(row, badge)
      skills.append(item)
    }
    const wrapper = document.createElement('div')
    wrapper.append(label, skills)
    list.append(wrapper)
  })
  area.append(list)
  document.body.append(area)
  return list
}

/** Lays out the parent, and each row's label text, column, and badges as `rows` places them. */
const mockLayout = (rows: RowLayout[]) =>
  mockRects({
    [AREA_TEST_ID]: AREA,
    ...Object.fromEntries(
      rows.flatMap(({ text, badges }, row) => [
        [
          buildTextTestId(row),
          new DOMRect(text.left, 0, text.right - text.left, 20),
        ],
        [buildSkillsTestId(row), SKILLS],
        ...badges.map((badge, index) => [
          buildBadgeTestId(row, index),
          buildItemRect(badge),
        ]),
      ])
    ),
  })

/** Lays out `rows` and runs the layout over them. */
const layOut = (rows: RowLayout[], isMobile: boolean) => {
  mockLayout(rows)
  const list = createList(rows.map(({ badges }) => badges.length))
  layOutSkills(list, isMobile)
}

const getShift = (testId: string) =>
  document.querySelector<HTMLElement>(`[data-testid="${testId}"]`)?.style
    .translate

// From sm up, every line starts at the column: a first line from 100 to 300,
// centered at 200, with one wrapped below from 100 to 180, centered at 140,
// then a short row.
const DESKTOP: RowLayout[] = [
  {
    text: { left: 40, right: 90 },
    badges: [
      { line: 0, left: 100, right: 190 },
      { line: 0, left: 196, right: 300 },
      { line: 1, left: 100, right: 180 },
    ],
  },
  {
    text: { left: 60, right: 90 },
    badges: [{ line: 0, left: 100, right: 160 }],
  },
]

// Below sm, every line centers in the column, at 300: a first line from 200
// to 400, with one wrapped below from 260 to 340, then a row from 270 to 330.
const MOBILE: RowLayout[] = [
  {
    text: { left: 40, right: 90 },
    badges: [
      { line: 0, left: 200, right: 296 },
      { line: 0, left: 302, right: 400 },
      { line: 1, left: 260, right: 340 },
    ],
  },
  {
    text: { left: 60, right: 90 },
    badges: [{ line: 0, left: 270, right: 330 }],
  },
]

describe('layOutSkills', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.replaceChildren()
  })

  describe('from sm up', () => {
    it('shifts the list to center its first row’s first line in the parent', () => {
      layOut(DESKTOP, false)
      expect(getShift(LIST_TEST_ID)).toBe('100px')
    })

    it('centers each wrapped line on its row’s first line', () => {
      layOut(DESKTOP, false)
      expect(getShift(buildBadgeTestId(0, 2))).toBe('60px')
    })

    it('starts a wrapped line wider than the first where the first starts', () => {
      layOut(
        [
          {
            text: { left: 40, right: 90 },
            badges: [
              { line: 0, left: 100, right: 200 },
              { line: 1, left: 100, right: 300 },
            ],
          },
        ],
        false
      )
      expect(getShift(buildBadgeTestId(0, 1))).toBe('')
    })

    it('leaves the labels, already by their first lines, where they are', () => {
      layOut(DESKTOP, false)
      for (const row of [0, 1]) {
        expect(getShift(buildLabelTestId(row)), `row ${row}`).toBe('')
      }
    })
  })

  describe('below sm', () => {
    it('shifts the list to center its labels and first lines together', () => {
      // From the first label's text, at 40 plus its row's 100px indent, to
      // the first line's end at 400, centered at 270.
      layOut(MOBILE, true)
      expect(getShift(LIST_TEST_ID)).toBe('30px')
    })

    it('shifts each label to sit by its row’s first line', () => {
      layOut(MOBILE, true)
      expect(getShift(buildLabelTestId(0))).toBe('100px')
      expect(getShift(buildLabelTestId(1))).toBe('170px')
    })

    it('centers each wrapped line on the parent, after the list’s shift', () => {
      layOut(MOBILE, true)
      expect(getShift(buildBadgeTestId(0, 2))).toBe('-30px')
    })
  })

  it('shifts the list only as far as keeps what it shows inside the parent', () => {
    // The second row's first line ends at 480, 120px from the parent's edge,
    // short of the 180px centering the first row's would take.
    layOut(
      [
        {
          text: { left: 40, right: 90 },
          badges: [{ line: 0, left: 100, right: 140 }],
        },
        {
          text: { left: 60, right: 90 },
          badges: [{ line: 0, left: 100, right: 480 }],
        },
      ],
      false
    )
    expect(getShift(LIST_TEST_ID)).toBe('120px')
  })

  it('clears a shift from its last layout that this one has no need of', () => {
    mockLayout(DESKTOP)
    const list = createList([3, 1])
    const firstBadge = list.querySelector<HTMLElement>('dd > *')
    if (firstBadge !== null) {
      firstBadge.style.translate = '50px'
    }
    layOutSkills(list, false)
    expect(getShift(buildBadgeTestId(0, 0))).toBe('')
  })
})
