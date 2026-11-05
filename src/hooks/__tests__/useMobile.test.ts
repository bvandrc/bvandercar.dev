import { renderHook } from '@testing-library/react'
import type { DetachedWindowAPI } from 'happy-dom'

import { useIsMobile } from '../useMobile'

declare global {
  interface Window {
    /** The handle on happy-dom's own window, which the test environment adds. */
    happyDOM: DetachedWindowAPI
  }
}

describe('useIsMobile', () => {
  it('is true below 768px', () => {
    for (const width of [
      320,
      767, // the last width before Tailwind's `md`
    ]) {
      window.happyDOM.setViewport({ width })
      const { result } = renderHook(() => useIsMobile())
      expect(result.current, String(width)).toBe(true)
    }
  })

  it('is false from 768px up', () => {
    for (const width of [
      768, // Tailwind's `md`, where the layout switches
      1280,
    ]) {
      window.happyDOM.setViewport({ width })
      const { result } = renderHook(() => useIsMobile())
      expect(result.current, String(width)).toBe(false)
    }
  })
})
