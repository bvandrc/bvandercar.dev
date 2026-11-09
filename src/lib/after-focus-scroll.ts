/**
 * Calls `callback` once the scroll that focusing `element` brings has finished.
 *
 * The browser scrolls a focused element into view if it isn't already, over
 * many frames where `scroll-behavior` is smooth. One already in view waits a
 * frame, for the scroll event of any instant scroll that brought it there.
 */
export const afterFocusScroll = (element: Element, callback: () => void) => {
  const { top, right, bottom, left } = element.getBoundingClientRect()
  const inView =
    top >= 0 &&
    left >= 0 &&
    bottom <= window.innerHeight &&
    right <= window.innerWidth
  if (inView) {
    requestAnimationFrame(callback)
  } else {
    window.addEventListener('scrollend', callback, { once: true })
  }
}
