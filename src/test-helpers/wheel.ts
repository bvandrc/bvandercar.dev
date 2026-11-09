import { createEvent, fireEvent } from '@testing-library/react'

/** Turns the wheel over `target` at `clientX`, with any other `init`, returning whether the page would scroll. */
export const turnWheel = (
  target: Element,
  clientX: number,
  deltaY: number,
  init?: WheelEventInit
) => {
  const event = createEvent.wheel(target, { deltaY })
  // The test DOM's WheelEvent drops a clientX, deltaX, or ctrlKey passed in,
  // which a browser's keeps.
  for (const [key, value] of Object.entries({ clientX, ...init })) {
    Object.defineProperty(event, key, { value })
  }
  return fireEvent(target, event)
}
