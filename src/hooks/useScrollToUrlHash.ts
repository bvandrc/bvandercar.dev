import { useEffect, useState } from 'react'

import { parseUrlHash, type UrlHashTarget } from '@/lib/url-hash'

/**
 * Scrolls to the element the URL's `#` names once the app has first rendered,
 * so a link to a section, like `/#skills`, or a project card, like
 * `/#bike-ride-tracker`, opens on it. Does the same when the `#` changes to
 * one with parameters, like `#task-rankr?show_charts=true`, which names no
 * element the browser could scroll to itself.
 *
 * Returns the `#`'s target once the page has landed on it, past the jump's
 * scroll event, so a tooltip opened then, which Radix closes on scroll, stays
 * open; `undefined` until then, or for no `#`. A plain `#id` the `#` changes
 * to, which the browser glides to itself, it returns at once.
 */
export const useScrollToUrlHash = () => {
  const [landed, setLanded] = useState<UrlHashTarget>()
  useEffect(() => {
    let frame: number | undefined
    const land = (target: UrlHashTarget) => {
      // Waits for the frame, by when the layout effects that resize what's
      // above it, like a card's name shrinking to fit its line, have settled,
      // so it lands where it stays.
      frame = requestAnimationFrame(() => {
        // Jumps, as the browser's own would, rather than gliding past every
        // section above it.
        document
          .getElementById(target.id)
          ?.scrollIntoView({ behavior: 'instant' })
        // The jump's scroll event fires as the next frame renders, before its
        // animation frame callbacks.
        frame = requestAnimationFrame(() => setLanded(target))
      })
    }
    const changeHash = () => {
      if (frame !== undefined) {
        cancelAnimationFrame(frame)
      }
      const target = parseUrlHash(window.location.hash)
      // A plain `#id` the browser glides to itself, and nothing waits on it
      // landing.
      if (target === undefined || target.params.size === 0) {
        setLanded(target)
        return
      }
      land(target)
    }

    // The browser looks for it as the page loads, before the app has rendered
    // it, so finds nothing.
    const loadTarget = parseUrlHash(window.location.hash)
    if (loadTarget !== undefined) {
      land(loadTarget)
    }
    window.addEventListener('hashchange', changeHash)
    return () => {
      window.removeEventListener('hashchange', changeHash)
      if (frame !== undefined) {
        cancelAnimationFrame(frame)
      }
    }
  }, [])
  return landed
}
