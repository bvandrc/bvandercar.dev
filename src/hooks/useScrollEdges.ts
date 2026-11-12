import { useEffect, useState } from 'react'

/**
 * Whether an element's sideways scroll is at its start, and at its end: both
 * where its content fits without scrolling.
 *
 * Keeps up as it scrolls, and as it or its content resizes.
 */
export const useScrollEdges = (ref: React.RefObject<HTMLElement | null>) => {
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = element
      // A px short, since a zoomed page scrolls by fractions of one.
      setAtStart(scrollLeft <= 1)
      setAtEnd(scrollLeft + clientWidth >= scrollWidth - 1)
    }

    update()
    element.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(element)
    // Its content, which changes the scroll's width without changing its own.
    for (const child of element.children) {
      observer.observe(child)
    }
    return () => {
      element.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [ref])

  return { atStart, atEnd }
}
