import { useEffect } from 'react'

/** The id the URL's `#` names, or `undefined` for none or one that won't decode. */
const getHashId = () => {
  try {
    return decodeURIComponent(window.location.hash.slice(1)) || undefined
  } catch {
    // A stray `%`, like `#100%`, which names no section anyway.
    return
  }
}

/**
 * Scrolls to the element the URL's `#` names once the app has first rendered,
 * so a link to a section, like `/#skills`, opens on it.
 */
export const useScrollToUrlHash = () => {
  useEffect(() => {
    const id = getHashId()
    if (id === undefined) {
      return
    }
    // The browser looks for it as the page loads, before the app has rendered
    // it, so finds nothing. Jumps, as the browser's own would, rather than
    // gliding past every section above it.
    document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
  }, [])
}
