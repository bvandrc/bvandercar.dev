/** One line of a wrapping flex box: its items, and its edges on screen, in px. */
export type FlexLine = {
  items: HTMLElement[]
  left: number
  right: number
  bottom: number
}

/** The lines a wrapping flex box's items sit on now, first to last. */
export const measureFlexLines = (box: HTMLElement): FlexLine[] => {
  const lines: FlexLine[] = []
  for (const item of box.children) {
    if (!(item instanceof HTMLElement)) {
      continue
    }
    const { top, left, right, bottom } = item.getBoundingClientRect()
    const line = lines.at(-1)
    // An item that starts above the line's bottom is on that line.
    if (line !== undefined && top < line.bottom) {
      line.items.push(item)
      line.right = right
    } else {
      lines.push({ items: [item], left, right, bottom })
    }
  }
  return lines
}
