import { useIsomorphicLayoutEffect } from 'usehooks-ts'

import { measureFlexLines } from '@/lib/flex-lines'

type FindFlexBoxes = (box: HTMLElement) => Iterable<HTMLElement>

const clearShifts = (flexBox: HTMLElement) => {
  for (const item of flexBox.children) {
    if (item instanceof HTMLElement) {
      item.style.translate = ''
    }
  }
}

const centerOnParent = (box: HTMLElement, findFlexBoxes: FindFlexBoxes) => {
  const parent = box.parentElement
  if (parent === null) {
    return
  }
  const area = parent.getBoundingClientRect()
  const center = (area.left + area.right) / 2
  for (const flexBox of findFlexBoxes(box)) {
    // Measures the lines where they sit with no shifts of the last measure's.
    clearShifts(flexBox)
    const [, ...wrapped] = measureFlexLines(flexBox)
    for (const { items, left, right } of wrapped) {
      const shift = Math.round(center - (left + right) / 2)
      for (const item of items) {
        item.style.translate = shift === 0 ? '' : `${shift}px`
      }
    }
  }
}

/**
 * Centers each line that the wrapping flex boxes inside a box wrap onto in
 * the box's parent, leaving each flex box's first line where it is.
 *
 * `findFlexBoxes` picks the flex boxes out of the box; give it a function that
 * keeps its identity across renders, like one declared at module scope. It
 * sets the inline `translate` of each wrapped line's items, so give them none
 * of their own; a shift never changes where a line wraps. Call it after
 * anything else that moves the box, since it measures the box where that
 * leaves it. It measures before the browser paints, and again when the box or
 * its parent resizes or a font loads. While `isEnabled` is false, the lines
 * stay where the flex boxes put them.
 */
export const useCenterWrappedLinesOnParent = (
  ref: React.RefObject<HTMLElement | null>,
  findFlexBoxes: FindFlexBoxes,
  isEnabled = true
) => {
  useIsomorphicLayoutEffect(() => {
    const box = ref.current
    if (box === null) {
      return
    }
    if (!isEnabled) {
      // Drops the shifts from while it was enabled.
      for (const flexBox of findFlexBoxes(box)) {
        clearShifts(flexBox)
      }
      return
    }
    const remeasure = () => centerOnParent(box, findFlexBoxes)
    remeasure()
    const observer = new ResizeObserver(remeasure)
    observer.observe(box)
    if (box.parentElement !== null) {
      observer.observe(box.parentElement)
    }
    const { fonts } = document
    fonts?.addEventListener('loadingdone', remeasure)
    return () => {
      observer.disconnect()
      fonts?.removeEventListener('loadingdone', remeasure)
    }
  }, [ref, findFlexBoxes, isEnabled])
}
