import { expect, type Page, test } from '@playwright/test'
import { groupBy } from 'es-toolkit'

import { SELECTORS } from '~/test-support/selectors'

const { SKILLS } = SELECTORS
const { GROUP } = SKILLS

type Box = { top: number; bottom: number; left: number; right: number }

/** Each skill group's box, and where its labels and badges landed. */
const getGroups = (page: Page) =>
  page.evaluate((ids) => {
    const toBox = (element: Element) => {
      const { top, bottom, left, right } = element.getBoundingClientRect()
      return { top, bottom, left, right }
    }
    const getFontSize = (element: Element) =>
      Number.parseFloat(getComputedStyle(element).fontSize)
    return [...document.querySelectorAll(`[data-testid="${ids.SELF}"]`)].map(
      (group) => {
        const rows = group.querySelector(`[data-testid="${ids.ROWS}"]`)
        if (!rows) {
          throw new Error('A skill group has no rows')
        }
        return {
          title: group.querySelector('h3')?.textContent ?? '',
          box: toBox(group),
          rows: toBox(rows),
          columnGap: Number.parseFloat(getComputedStyle(rows).columnGap),
          labels: [
            ...rows.querySelectorAll(`[data-testid="${ids.LABEL}"]`),
          ].map((label) => {
            const style = getComputedStyle(label)
            const range = document.createRange()
            range.selectNodeContents(label)
            const lines = [...range.getClientRects()]
            // How narrow the label can wrap: as wide as its longest word.
            const text = label.firstChild ?? label
            const wordWidths = [
              ...(label.textContent ?? '').matchAll(/\S+/g),
            ].map((word) => {
              range.setStart(text, word.index)
              range.setEnd(text, word.index + word[0].length)
              return range.getBoundingClientRect().width
            })
            return {
              text: label.textContent ?? '',
              // The text's own edges, not its box's, which fills the column.
              left: Math.min(...lines.map((line) => line.left)),
              right: Math.max(...lines.map((line) => line.right)),
              fontSize: getFontSize(label),
              lineCount: new Set(lines.map((line) => Math.round(line.top)))
                .size,
              narrowestWidth: Math.max(...wordWidths),
              // The label's first line of text, inside its padding.
              firstLineMiddle:
                label.getBoundingClientRect().top +
                Number.parseFloat(style.paddingTop) +
                Number.parseFloat(style.lineHeight) / 2,
            }
          }),
          lists: [
            ...rows.querySelectorAll(`[data-testid="${ids.BADGES}"]`),
          ].map((list) => {
            const badges = [
              ...list.querySelectorAll(`[data-testid="${ids.BADGE}"]`),
            ]
            return {
              ...toBox(list),
              gap: Number.parseFloat(getComputedStyle(list).columnGap),
              badges: badges.map(toBox),
              fontSizes: badges.map(getFontSize),
            }
          }),
        }
      }
    )
  }, GROUP)

/** A list's badges, a line at a time, top line first. */
const getLines = (badges: Box[]) =>
  Object.values(groupBy(badges, (badge) => Math.round(badge.top))).map(
    (line) => ({
      left: Math.min(...line.map((badge) => badge.left)),
      right: Math.max(...line.map((badge) => badge.right)),
    })
  )

const getMiddle = ({ left, right }: Pick<Box, 'left' | 'right'>) =>
  (left + right) / 2

/** Fails unless every group's labels and badges make two lined-up columns. */
const expectColumns = async (page: Page) => {
  for (const { labels, lists } of await getGroups(page)) {
    const [firstLabel] = labels
    const [firstList] = lists
    for (const [index, label] of labels.entries()) {
      const list = lists[index]
      const [firstBadge] = list.badges
      expect(label.right, `${label.text} shares a right edge`).toBeCloseTo(
        firstLabel.right,
        0
      )
      expect(list.left, `${label.text}'s badges share a left edge`).toBeCloseTo(
        firstList.left,
        0
      )
      expect(
        list.left,
        `${label.text}'s badges sit right of it`
      ).toBeGreaterThan(label.right)
      expect(
        label.firstLineMiddle,
        `${label.text} sits level with its first line of badges`
      ).toBeCloseTo((firstBadge.top + firstBadge.bottom) / 2, 0)
    }
  }
}

test.describe('Skills, from sm up', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId(SKILLS.SELF).scrollIntoViewIfNeeded()
  })

  test('sets each label beside its badges, in two lined-up columns', async ({
    page,
  }) => {
    await expectColumns(page)
  })

  test('centers each group, at most 512px wide, on its first row of badges', async ({
    page,
  }) => {
    for (const { title, box, rows, lists } of await getGroups(page)) {
      expect(rows.right - rows.left, title).toBeLessThanOrEqual(512)
      // The group's heading is centered across its box.
      const [firstLine] = getLines(lists[0].badges)
      expect(getMiddle(firstLine), title).toBeCloseTo(getMiddle(box), 0)
    }
  })

  test('centers a wrapped line of badges under the line above it', async ({
    page,
  }) => {
    const lists = (await getGroups(page)).flatMap((group) => group.lists)
    const wrapped = lists.filter((list) => getLines(list.badges).length > 1)
    // Otherwise this case checks nothing: today, Languages wraps.
    expect(wrapped.length).toBeGreaterThan(0)
    for (const list of wrapped) {
      const [firstLine, ...lines] = getLines(list.badges)
      expect(firstLine.left, 'the first line starts at the list').toBeCloseTo(
        list.left,
        0
      )
      for (const line of lines) {
        expect(getMiddle(line)).toBeCloseTo(getMiddle(firstLine), 0)
      }
    }
  })

  test('keeps its badges and labels at their full size', async ({ page }) => {
    for (const { labels, lists } of await getGroups(page)) {
      for (const label of labels) {
        expect(label.fontSize, label.text).toBe(14)
      }
      for (const fontSize of lists.flatMap((list) => list.fontSizes)) {
        expect(fontSize).toBe(14)
      }
    }
  })
})

test.describe('Skills, below sm', () => {
  // A Pixel 7's width.
  test.use({ viewport: { width: 412, height: 915 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId(SKILLS.SELF).scrollIntoViewIfNeeded()
  })

  test('sets each label beside its badges, in two lined-up columns', async ({
    page,
  }) => {
    await expectColumns(page)
  })

  test('centers each group as a whole across the full screen', async ({
    page,
  }) => {
    const skills = await page.getByTestId(SKILLS.SELF).boundingBox()
    expect(skills).toMatchObject({ x: 0, width: 412 })
    for (const { rows } of await getGroups(page)) {
      expect(getMiddle(rows)).toBeCloseTo(412 / 2, 0)
    }
  })

  test('starts a wrapped line of badges at the same edge as the line above', async ({
    page,
  }) => {
    const lists = (await getGroups(page)).flatMap((group) => group.lists)
    const wrapped = lists.filter((list) => getLines(list.badges).length > 1)
    // Otherwise this case checks nothing: today, Languages wraps.
    expect(wrapped.length).toBeGreaterThan(0)
    for (const list of wrapped) {
      for (const line of getLines(list.badges)) {
        expect(line.left).toBeCloseTo(list.left, 0)
      }
    }
  })

  test('shrinks its badges and labels, and keeps each label on one line', async ({
    page,
  }) => {
    for (const { labels, lists } of await getGroups(page)) {
      for (const label of labels) {
        expect(label, label.text).toMatchObject({
          fontSize: 12,
          lineCount: 1,
        })
      }
      for (const fontSize of lists.flatMap((list) => list.fontSizes)) {
        expect(fontSize).toBe(13)
      }
    }
  })
})

test.describe('Skills, on the narrowest phones', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId(SKILLS.SELF).scrollIntoViewIfNeeded()
  })

  test('keeps its columns, and every badge, on screen', async ({ page }) => {
    await expectColumns(page)
    for (const { labels, lists } of await getGroups(page)) {
      for (const box of [...labels, ...lists.flatMap((list) => list.badges)]) {
        expect(box.left).toBeGreaterThanOrEqual(0)
        expect(box.right).toBeLessThanOrEqual(320)
      }
    }
  })

  test("wraps a row's badges only where they can't fit beside its labels wrapped", async ({
    page,
  }) => {
    for (const { title, columnGap, labels, lists } of await getGroups(page)) {
      // The room the badges have once every label wraps as narrow as it goes.
      const labelsWidth = Math.max(
        ...labels.map((label) => label.narrowestWidth)
      )
      const room = 320 - labelsWidth - columnGap
      for (const [index, list] of lists.entries()) {
        const oneLineWidth =
          list.badges.reduce(
            (width, badge) => width + badge.right - badge.left,
            0
          ) +
          list.gap * (list.badges.length - 1)
        if (oneLineWidth <= room) {
          expect(
            getLines(list.badges),
            `${title}: ${labels[index].text}'s badges`
          ).toHaveLength(1)
        }
      }
    }
  })
})
