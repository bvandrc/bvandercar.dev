import { renderHook, waitFor } from '@testing-library/react'

import { useScrollToUrlHash } from '../useScrollToUrlHash'

const TARGET_ID = 'target'

/** Puts an element with `TARGET_ID` on the page, and mocks its `scrollIntoView`. */
const createTarget = () => {
  const target = document.createElement('div')
  target.id = TARGET_ID
  document.body.append(target)
  const scrollIntoView = vi.fn()
  target.scrollIntoView = scrollIntoView
  return { target, scrollIntoView }
}

/** Sets the URL's `#`, as a link on the page would, which fires `hashchange` a task later. */
const changeHash = (hash: string) => {
  window.location.hash = hash
}

/** The hook's target, with its parameters as a plain object to compare. */
const getLanded = (result: {
  current: ReturnType<typeof useScrollToUrlHash>
}) =>
  result.current && {
    ...result.current,
    params: Object.fromEntries(result.current.params),
  }

describe('useScrollToUrlHash', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
    document.body.replaceChildren()
  })

  it("jumps to the `#`'s element once rendered, then returns its target", async () => {
    window.history.replaceState(null, '', `/#${TARGET_ID}?show_charts=true`)
    const { scrollIntoView } = createTarget()
    const { result } = renderHook(useScrollToUrlHash)
    // Not until it has jumped.
    expect(result.current).toBeUndefined()

    await waitFor(() =>
      expect(getLanded(result)).toEqual({
        id: TARGET_ID,
        params: { show_charts: 'true' },
      })
    )
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant' })
  })

  it('jumps again to a `#` with parameters it changes to, which names no element the browser could scroll to', async () => {
    const { scrollIntoView } = createTarget()
    const { result } = renderHook(useScrollToUrlHash)

    changeHash(`${TARGET_ID}?show_charts=true`)
    await waitFor(() =>
      expect(getLanded(result)).toEqual({
        id: TARGET_ID,
        params: { show_charts: 'true' },
      })
    )
    expect(scrollIntoView).toHaveBeenCalledOnce()
  })

  it('leaves a plain `#id` it changes to for the browser to glide to', async () => {
    const { scrollIntoView } = createTarget()
    const { result } = renderHook(useScrollToUrlHash)

    changeHash(TARGET_ID)
    await waitFor(() =>
      expect(getLanded(result)).toEqual({ id: TARGET_ID, params: {} })
    )
    // A jump would come before the target.
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
