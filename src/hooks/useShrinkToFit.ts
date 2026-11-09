import { useLayoutEffect, useState } from 'react'

type Fit = { size: 'LARGE' | 'SMALL'; isSettled: boolean }

const UNMEASURED: Fit = { size: 'LARGE', isSettled: false }

/**
 * Whether a line's text takes its smaller size: only where that keeps the
 * line on one line, and its larger size doesn't.
 *
 * `lineRef` is the line, and `textRef` the text whose height one line is. It
 * measures before the browser paints, so neither size flashes, and again
 * whenever the line's width changes, or its fonts load.
 */
export const useShrinkToFit = (
  lineRef: React.RefObject<HTMLElement | null>,
  textRef: React.RefObject<HTMLElement | null>
) => {
  const [fit, setFit] = useState<Fit>(UNMEASURED)
  useLayoutEffect(() => {
    const line = lineRef.current
    const text = textRef.current
    if (fit.isSettled || !line || !text) {
      return
    }
    // Wrapped, where the line runs taller than its text's own line.
    const isWrapped = line.offsetHeight > text.offsetHeight
    if (fit.size === 'LARGE') {
      setFit(
        isWrapped
          ? { size: 'SMALL', isSettled: false }
          : { size: 'LARGE', isSettled: true }
      )
      return
    }
    // Where the smaller size wraps too, it saves nothing, so the larger stays.
    setFit({ size: isWrapped ? 'LARGE' : 'SMALL', isSettled: true })
  }, [fit, lineRef, textRef])
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
  return fit.size === 'SMALL'
}
