import { useEffect, useState } from 'react'

import {
  pickActiveSection,
  type SectionBounds,
} from '@/lib/pick-active-section'

const measureSections = (ids: readonly string[]): SectionBounds[] =>
  ids.flatMap((id) => {
    const section = document.getElementById(id)
    if (section === null) {
      return []
    }
    const { top, bottom } = section.getBoundingClientRect()
    return [{ id, top, bottom }]
  })

/**
 * The id of the section, of `ids` in page order, the reader is scrolled to:
 * the last whose top has passed `line` px down the viewport.
 *
 * `undefined` above the first or past the last. Keeps up as the page scrolls
 * or resizes. Pass the same array each render.
 */
export const useActiveSection = (ids: readonly string[], line: number) => {
  const [activeId, setActiveId] = useState<string>()

  useEffect(() => {
    let frame: number | undefined
    const update = () => {
      frame = undefined
      const { scrollY, innerHeight } = window
      setActiveId(
        pickActiveSection(measureSections(ids), {
          line,
          viewportHeight: innerHeight,
          // A px short, for a page whose height isn't a whole number of them.
          atBottom:
            scrollY + innerHeight >= document.documentElement.scrollHeight - 1,
        })
      )
    }
    // Once a frame at most, however many scroll events it brings.
    const scheduleUpdate = () => {
      frame ??= requestAnimationFrame(update)
    }

    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (frame !== undefined) {
        cancelAnimationFrame(frame)
      }
    }
  }, [ids, line])

  return activeId
}
