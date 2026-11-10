import { createLazyLoad } from '@bvandrc/react-toolkit'

/** Loads the charts' code, and the histories they chart. */
const loadCharts = () =>
  Promise.all([
    import('../charts/ProjectCharts'),
    import('../charts/lib/project-charts'),
  ]).then(([{ ProjectCharts }, { getProjectCharts }]) => ({
    ProjectCharts,
    getProjectCharts,
  }))

/**
 * The project charts' code and data, which stay out of the page's first load,
 * and a `prefetch` that starts loading them.
 *
 * Takes whether the project may chart at all. Loading them for one set of
 * counts loads them for every other, mounted or mounted later.
 */
export const useLazyCharts = createLazyLoad(loadCharts)
