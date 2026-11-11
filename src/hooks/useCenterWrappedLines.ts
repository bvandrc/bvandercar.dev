import { useIsomorphicLayoutEffect } from 'usehooks-ts'

import { measureFlexLines } from '@/lib/flex-lines'

const centerWrappedLines = (box: HTMLElement) => {
  // Measures the lines as they wrap with no offsets of the last measure's.
  for (const item of box.children) {
    if (item instanceof HTMLElement) {
      item.style.marginInlineStart = ''
    }
  }
  const [first, ...wrapped] = measureFlexLines(box)
  if (first === undefined) {
    return
  }
  const firstWidth = first.right - first.left
  for (const { items, left, right } of wrapped) {
    // Rounded down, so the offset never pushes the line's last item onto the
    // next.
    const offset = Math.floor((firstWidth - (right - left)) / 2)
    if (offset > 0) {
      items[0].style.marginInlineStart = `${offset}px`
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
