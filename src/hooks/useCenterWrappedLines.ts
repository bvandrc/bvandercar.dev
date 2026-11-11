import { useIsomorphicLayoutEffect } from 'usehooks-ts'

type Line = {
  items: HTMLElement[]
  left: number
  right: number
  bottom: number
}

const centerWrappedLines = (box: HTMLElement) => {
  const items = Array.from(box.children).filter(
    (item) => item instanceof HTMLElement
  )
  // Measures the lines as they wrap with no offsets of the last measure's.
  for (const item of items) {
    item.style.marginInlineStart = ''
  }
  const lines: Line[] = []
  for (const item of items) {
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
  const [first, ...wrapped] = lines
  if (first === undefined) {
    return
  }
  const firstWidth = first.right - first.left
  for (const { items: lineItems, left, right } of wrapped) {
    // Rounded down, so the offset never pushes the line's last item onto the
    // next.
    const offset = Math.floor((firstWidth - (right - left)) / 2)
    if (offset > 0) {
      lineItems[0].style.marginInlineStart = `${offset}px`
    }
  }
}

/**
 * Centers each line a wrapping flex box wraps onto under its first line,
 * which stays where the box puts it.
 *
 * Give the box `justify-start`. A wrapped line wider than the first starts
 * where the first does. It sets the inline `margin-inline-start` of each
 * line's first item, so give the items none of their own. It measures before
 * the browser paints, and again when the box resizes or a font loads.
 */
export const useCenterWrappedLines = (
  ref: React.RefObject<HTMLElement | null>
) => {
  useIsomorphicLayoutEffect(() => {
    const box = ref.current
    if (box === null) {
      return
    }
    const remeasure = () => centerWrappedLines(box)
    remeasure()
    // An offset never changes where a line wraps, so the box's size never
    // changes with one.
    const observer = new ResizeObserver(remeasure)
    observer.observe(box)
    const { fonts } = document
    fonts?.addEventListener('loadingdone', remeasure)
    return () => {
      observer.disconnect()
      fonts?.removeEventListener('loadingdone', remeasure)
    }
  }, [ref])
}
