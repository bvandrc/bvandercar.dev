import { useIsomorphicLayoutEffect } from 'usehooks-ts'

import { measureFlexLines } from '@/lib/flex-lines'

const centerOnFirstLine = (box: HTMLElement, lines: HTMLElement) => {
  const parent = box.parentElement
  if (parent === null) {
    return
  }
  // Measures where the box sits with no shift of the last measure's.
  box.style.translate = ''
  const [first] = measureFlexLines(lines)
  if (first === undefined) {
    return
  }
  const area = parent.getBoundingClientRect()
  const { left, right } = box.getBoundingClientRect()
  const shift = Math.round(
    (area.left + area.right) / 2 - (first.left + first.right) / 2
  )
  // Kept inside the parent, so a box as wide as it never moves.
  const kept = Math.min(
    Math.max(shift, Math.ceil(area.left - left)),
    Math.floor(area.right - right)
  )
  box.style.translate = kept === 0 ? '' : `${kept}px`
}

/**
 * Shifts a box sideways so the first line of a wrapping flex box inside it is
 * centered in the box's parent, as far as the box can move and stay inside.
 *
 * `findLines` picks that flex box out of the box; give it a function that
 * keeps its identity across renders, like one declared at module scope. It
 * sets the box's inline `translate`, so give the box none of its own. It
 * measures before the browser paints, and again when the parent or the flex
 * box resizes or a font loads.
 */
export const useCenterOnFirstLine = (
  ref: React.RefObject<HTMLElement | null>,
  findLines: (box: HTMLElement) => HTMLElement | null
) => {
  useIsomorphicLayoutEffect(() => {
    const box = ref.current
    const lines = box === null ? null : findLines(box)
    if (box === null || lines === null) {
      return
    }
    const remeasure = () => centerOnFirstLine(box, lines)
    remeasure()
    // A shift never changes either one's size.
    const observer = new ResizeObserver(remeasure)
    if (box.parentElement !== null) {
      observer.observe(box.parentElement)
    }
    observer.observe(lines)
    const { fonts } = document
    fonts?.addEventListener('loadingdone', remeasure)
    return () => {
      observer.disconnect()
      fonts?.removeEventListener('loadingdone', remeasure)
    }
  }, [ref, findLines])
}
