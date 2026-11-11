import { useLayoutEffect } from 'react'
import { groupBy } from 'es-toolkit'

/** How wide a wrapping list's widest line of children is. */
const getWidestLineWidth = (list: HTMLElement) => {
  const lines = Object.values(
    // Badges share a height, so those on one line share a top.
    groupBy(
      [...list.children].map((child) => child.getBoundingClientRect()),
      (rect) => Math.round(rect.top)
    )
  )
  const widths = lines.map(
    (line) =>
      Math.max(...line.map((rect) => rect.right)) -
      Math.min(...line.map((rect) => rect.left))
  )
  // Rounded up: a hair short would push a line's last badge onto the next.
  return Math.ceil(Math.max(0, ...widths))
}

/**
 * Sizes each badge list (`dd`) in a skill group's `dl` to its widest line, and
 * sets `--first-row-shift` on the `dl`.
 *
 * Shrunk to its lines, a list's wrapped lines center under its first, and the
 * group shrinks to its badges. The shift is how far to move the `dl` to center
 * its first row of badges where the `dl` itself is centered. Measured before
 * paint, and again whenever the group's container changes width.
 */
export const useBadgeListsLayout = (
  ref: React.RefObject<HTMLDListElement | null>
) => {
  useLayoutEffect(() => {
    const group = ref.current
    const container = group?.parentElement
    if (!group || !container) {
      return
    }
    const lists = [...group.querySelectorAll('dd')]

    const layOut = () => {
      // Each list back at its column's full width, to see where it wraps there.
      for (const list of lists) {
        list.style.width = ''
      }
      const widths = lists.map(getWidestLineWidth)
      lists.forEach((list, index) => {
        list.style.width = `${widths[index]}px`
      })

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
