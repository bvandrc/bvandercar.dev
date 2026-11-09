import { afterFocusScroll } from '../after-focus-scroll'

/** Creates an element laid out at `top`, 20px tall, in a 768px-tall viewport. */
const createElementAt = (top: number) => {
  const element = document.createElement('a')
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ x: 0, y: top, width: 100, height: 20 })
  )
  window.innerHeight = 768
  return element
}

/** Resolves after the next animation frame's callbacks have run. */
const waitForFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))

describe('afterFocusScroll', () => {
  it('calls back a frame on for an element already in view', async () => {
    const callback = vi.fn()
    afterFocusScroll(createElementAt(100), callback)

    expect(callback).not.toHaveBeenCalled()
    await waitForFrame()
    expect(callback).toHaveBeenCalledOnce()
  })

  it('calls back once the page has scrolled an element out of view to it', async () => {
    const callback = vi.fn()
    afterFocusScroll(createElementAt(2000), callback)

    await waitForFrame()
    expect(callback).not.toHaveBeenCalled()
    window.dispatchEvent(new Event('scrollend'))
    window.dispatchEvent(new Event('scrollend'))
    expect(callback).toHaveBeenCalledOnce()
  })
})
