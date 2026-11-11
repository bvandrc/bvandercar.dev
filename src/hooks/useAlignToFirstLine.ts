import { useIsomorphicLayoutEffect } from 'usehooks-ts'

import { measureFlexLines } from '@/lib/flex-lines'

const alignToFirstLine = (box: HTMLElement, lines: HTMLElement) => {
  const [first] = measureFlexLines(lines)
  const start = lines.getBoundingClientRect().left
  // Rounded down, so the box never runs into the line.
  const offset = first === undefined ? 0 : Math.floor(first.left - start)
  box.style.translate = offset > 0 ? `${offset}px` : ''
}

/**
 * Shifts a box sideways by as far as a wrapping flex box's first line starts
 * from the flex box's own start, so a box laid out right before the flex box
 * stays right before its first line wherever the line sits, like centered.
 *
 * It sets the box's inline `translate`, so give the box none of its own. It
 * measures before the browser paints, and again when the flex box resizes or
 * a font loads.
 */
export const useAlignToFirstLine = (
  ref: React.RefObject<HTMLElement | null>,
  linesRef: React.RefObject<HTMLElement | null>
) => {
  useIsomorphicLayoutEffect(() => {
    const box = ref.current
    const lines = linesRef.current
    if (box === null || lines === null) {
      return
    }
    const remeasure = () => alignToFirstLine(box, lines)
    remeasure()
    // A shift of the box never changes the flex box's size.
    const observer = new ResizeObserver(remeasure)
    observer.observe(lines)
    const { fonts } = document
    fonts?.addEventListener('loadingdone', remeasure)
    return () => {
      observer.disconnect()
      fonts?.removeEventListener('loadingdone', remeasure)
    }
  }, [ref, linesRef])
}
