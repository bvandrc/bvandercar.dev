import { useState } from 'react'

/** Loads the charts' code, and the histories they chart, which the module system keeps once loaded. */
const loadCharts = () =>
  Promise.all([
    import('../charts/ProjectCharts'),
    import('../charts/lib/project-charts'),
  ]).then(([{ ProjectCharts }, { getProjectCharts }]) => ({
    ProjectCharts,
    getProjectCharts,
  }))

/** The charts' component, and what decides what a project charts. */
export type LazyCharts = Awaited<ReturnType<typeof loadCharts>>

// Kept once loaded, so counts mounted later start with them.
let loadedCharts: LazyCharts | undefined

/**
 * The project charts' code and data, which stay out of the page's first load,
 * and a function that starts loading them.
 *
 * They're undefined until loaded, or for good where `mayChart` is false, and
 * null once they've failed to load, offline say. Loading them for one set of
 * counts loads them for every other.
 */
export const useLazyCharts = (mayChart: boolean) => {
  const [charts, setCharts] = useState<LazyCharts | null | undefined>(
    loadedCharts
  )
  /** Starts loading the charts, if there may be any and they haven't been. */
  const prefetchCharts = () => {
    if (mayChart && charts === undefined) {
      loadCharts().then(
        (loaded) => {
          loadedCharts = loaded
          setCharts(loaded)
        },
        () => setCharts(null)
      )
    }
  }
  return { charts, prefetchCharts }
}
