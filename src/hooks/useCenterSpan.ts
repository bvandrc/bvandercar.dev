import { useIsomorphicLayoutEffect } from 'usehooks-ts'

/** A stretch of the screen from left to right, in px. */
export type Span = { left: number; right: number }

type MeasureSpan = (box: HTMLElement) => Span | undefined

const measureOwnBounds: MeasureSpan = (box) => box.getBoundingClientRect()

const centerSpan = (
  box: HTMLElement,
  measureSpan: MeasureSpan,
  measureBounds: MeasureSpan
) => {
  const parent = box.parentElement
  if (parent === null) {
    return
  }
  // Measures where the box sits with no shift of the last measure's.
  box.style.translate = ''
  const span = measureSpan(box)
  if (span === undefined) {
    return
  }
  const area = parent.getBoundingClientRect()
  const { left, right } = measureBounds(box) ?? box.getBoundingClientRect()
  const shift = Math.round(
    (area.left + area.right) / 2 - (span.left + span.right) / 2
  )
  // Keeps the bounds inside the parent, so bounds as wide as it never move.
  const kept = Math.min(
    Math.max(shift, Math.ceil(area.left - left)),
    Math.floor(area.right - right)
  )
  box.style.translate = kept === 0 ? '' : `${kept}px`
}

/**
 * Shifts a box sideways so a span of what it shows is centered in the box's
 * parent, as far as its bounds can move and stay inside.
 *
 * `measureSpan` reads that span off the box, or finds none to center, and
 * `measureBounds` what must stay inside the parent, by default the box
 * itself. Bounds narrower than the box let the box's edges move past the
 * parent's, so clip the parent's overflow. Give each a function that keeps
 * its identity across renders, like one declared at module scope, and pass
 * another to measure something else. It sets the box's inline `translate`, so
 * give the box none of its own. It measures before the browser paints, and
 * again when the box or its parent resizes or a font loads.
 */
export const useCenterSpan = (
  ref: React.RefObject<HTMLElement | null>,
  measureSpan: MeasureSpan,
  measureBounds: MeasureSpan = measureOwnBounds
) => {
  useIsomorphicLayoutEffect(() => {
    const box = ref.current
    if (box === null) {
      return
    }
    const remeasure = () => centerSpan(box, measureSpan, measureBounds)
    remeasure()
    // A shift never changes either one's size.
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
  }, [ref, measureSpan, measureBounds])
}
