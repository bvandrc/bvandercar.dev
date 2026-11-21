// biome-ignore lint/performance/noBarrelFile: the LineChart folder's entry point, so code outside it never reaches past it to its private hooks and lib.
export {
  LineChart,
  type LineChartHover,
  type LineChartPoint,
  type LineChartProps,
} from './LineChart'
export type { PlotDomain, PlotRange } from './lib/plot'
