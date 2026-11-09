import { useLayoutEffect, useState } from 'react'

type Fit = { step: number; isSettled: boolean }

const UNMEASURED: Fit = { step: 0, isSettled: false }

/**
 * How many steps down from its largest size a line's text takes: the fewest
 * that keep the line on one line, or none where no step does.
 *
 * `lineRef` is the line, `textRef` the text whose height one line is, and
 * `stepCount` how many sizes the text has, largest first. It measures before
 * the browser paints, so no size flashes, and again whenever the line's
 * width changes, or its fonts load.
 */
export const useShrinkToFit = (
  lineRef: React.RefObject<HTMLElement | null>,
  textRef: React.RefObject<HTMLElement | null>,
  stepCount: number
) => {
  const [fit, setFit] = useState<Fit>(UNMEASURED)
  useLayoutEffect(() => {
    const line = lineRef.current
    const text = textRef.current
    if (fit.isSettled || !line || !text) {
      return
    }
    // Wrapped, where the line runs taller than its text's own line.
    if (line.offsetHeight <= text.offsetHeight) {
      setFit({ step: fit.step, isSettled: true })
    } else if (fit.step < stepCount - 1) {
      setFit({ step: fit.step + 1, isSettled: false })
    } else {
      // Where even the smallest size wraps, shrinking saves nothing.
      setFit({ step: 0, isSettled: true })
    }
  }, [fit, lineRef, textRef, stepCount])
  useLayoutEffect(() => {
    const line = lineRef.current
    if (!line) {
      return
    }
    let width = line.offsetWidth
    const observer = new ResizeObserver(() => {
      // Only its width changes what fits; its height changes as it measures.
      if (line.offsetWidth !== width) {
        width = line.offsetWidth
        setFit(UNMEASURED)
      }
    })
    observer.observe(line)
    // A font that loads late changes how wide the text runs.
    document.fonts?.ready.then(() => setFit(UNMEASURED))
    return () => observer.disconnect()
  }, [lineRef])
  return fit.step
}
