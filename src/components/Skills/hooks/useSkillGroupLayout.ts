import { useLayoutEffect } from 'react'
import { groupBy } from 'es-toolkit'

/** How wide the widest of a set of boxes laid out in lines is, rounded up. */
const getWidestLineWidth = (rects: DOMRect[]) => {
  // The boxes on one line share a top.
  const lines = Object.values(groupBy(rects, (rect) => Math.round(rect.top)))
  const widths = lines.map(
    (line) =>
      Math.max(...line.map((rect) => rect.right)) -
      Math.min(...line.map((rect) => rect.left))
  )
  // Rounded up: a hair short would push a line's last box onto the next.
  return Math.ceil(Math.max(0, ...widths))
}

/** The boxes of a label's lines of text. */
const getTextLines = (label: HTMLElement) => {
  const text = document.createRange()
  text.selectNodeContents(label)
  return [...text.getClientRects()]
}

/**
 * Shrinks a skill group's `dl` to what it shows, and sets `--first-row-shift`
 * on it.
 *
 * Sizes each badge list (`dd`) to its widest line, so its wrapped lines can
 * center under its first, and the labels' column to its widest line of text,
 * so a label that wraps leaves no room beside it. The `dl` then shrinks to its
 * labels and badges. The shift is how far to move the `dl` to center its first
 * row of badges where the `dl` itself is centered. Measured before paint, and
 * again whenever the group's container changes width.
 */
export const useSkillGroupLayout = (
  ref: React.RefObject<HTMLDListElement | null>
) => {
  useLayoutEffect(() => {
    const group = ref.current
    const container = group?.parentElement
    if (!group || !container) {
      return
    }
    const labels = [...group.querySelectorAll('dt')]
    const lists = [...group.querySelectorAll('dd')]

    const layOut = () => {
      // Everything back at its full width, to see where it wraps there.
      group.style.gridTemplateColumns = ''
      for (const list of lists) {
        list.style.width = ''
      }
      const listWidths = lists.map((list) =>
        getWidestLineWidth(
          [...list.children].map((badge) => badge.getBoundingClientRect())
        )
      )
      lists.forEach((list, index) => {
        list.style.width = `${listWidths[index]}px`
      })
      // Measured after the lists, which wrap first, and before this column
      // shrinks to it, so each label keeps the lines it has.
      const labelsWidth = Math.max(
        0,
        ...labels.map((label) => getWidestLineWidth(getTextLines(label)))
      )
      group.style.gridTemplateColumns = `${labelsWidth}px auto`

      const [firstList] = lists
      if (!firstList) {
        return
      }
      // A transform moves both rects alike, so the last shift cancels out.
      const groupRect = group.getBoundingClientRect()
      const firstRect = firstList.getBoundingClientRect()
      const shift =
        groupRect.left +
        groupRect.width / 2 -
        (firstRect.left + firstRect.width / 2)
      group.style.setProperty('--first-row-shift', `${shift}px`)
    }

    layOut()
    let width = container.clientWidth
    // Laying out changes the container's height, not its width, so this
    // skips the notice its own change brings.
    const observer = new ResizeObserver(() => {
      if (container.clientWidth !== width) {
        width = container.clientWidth
        layOut()
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [ref])
}
