import { useEffect, useState } from 'react'

/** The id the URL's `#` names, or `undefined` for none or one that won't decode. */
const getHashId = () => {
  try {
    return decodeURIComponent(window.location.hash.slice(1)) || undefined
  } catch {
    // A stray `%`, like `#100%`, which names no section or card anyway.
    return
  }
}

/**
 * Scrolls to the element the URL's `#` names once the app has first rendered,
 * so a link to a section, like `/#skills`, or a project card, like
 * `/#bike-ride-tracker`, opens on it.
 *
 * Returns that id once the page has landed there, past the jump's scroll
 * event, so a tooltip opened then, which Radix closes on scroll, stays open;
 * `undefined` until then, or for no `#`.
 */
export const useScrollToUrlHash = () => {
  const [landedId, setLandedId] = useState<string>()
  useEffect(() => {
    const id = getHashId()
    if (id === undefined) {
      return
    }
    // The browser looks for it as the page loads, before the app has rendered
    // it, so finds nothing. Waits for the frame, by when the layout effects
    // that resize what's above it, like a card's name shrinking to fit its
    // line, have settled, so it lands where it stays.
    let frame = requestAnimationFrame(() => {
      // Jumps, as the browser's own would, rather than gliding past every
      // section above it.
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
      // The jump's scroll event fires as the next frame renders, before its
      // animation frame callbacks.
      frame = requestAnimationFrame(() => setLandedId(id))
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  return landedId
}
