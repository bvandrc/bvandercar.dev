import { useState } from 'react'

import type { CommitHistory, DownloadHistory, Registry } from '~/counts'
import { ActivityChart } from './ActivityChart'
import { DownloadsChart } from './DownloadsChart'
import { type DaySpan, panSpan, zoomSpan } from './lib/spans'
import type { RunningTotalChartViewProps } from './RunningTotalChart'

export type ProjectChartsProps = Pick<
  RunningTotalChartViewProps,
  'releases'
> & {
  /** The dates both charts span, zoomed all the way out */
  span: DaySpan
  activity?: CommitHistory
  downloads?: { registry: Registry; history: DownloadHistory }
}

/**
 * A project's commits chart, then its package's downloads chart, whichever
 * it has, sharing one span, zoom, and set of releases.
 *
 * Mounted with the tooltip it sits in, so each opening starts zoomed out.
 * Loaded on its own, with the histories it charts, the first time a
 * project's counts are hovered, so neither the charts' code, gestures
 * included, nor their data is in the page's first load.
 */
export const ProjectCharts = ({
  activity,
  downloads,
  span: fullSpan,
  releases,
}: ProjectChartsProps) => {
  // Shared by both charts, so a release stays lined up across them as they zoom.
  const [zoomedSpan, setZoomedSpan] = useState<DaySpan>()
  // Each from the span before, so gestures landing in one frame build on
  // each other rather than all starting from the same one.
  /** Zooms both charts around a time under the pointer, scaling their width by `factor`. */
  const zoom = (anchor: number, factor: number) =>
    setZoomedSpan((previous) =>
      zoomSpan(previous ?? fullSpan, fullSpan, anchor, factor)
    )
  /** Moves both zoomed-in charts `delta` milliseconds later. */
  const pan = (delta: number) =>
    setZoomedSpan((previous) => panSpan(previous, fullSpan, delta))
  const shared = {
    releases,
    span: zoomedSpan ?? fullSpan,
    zoomed: zoomedSpan !== undefined,
    onZoom: zoom,
    onPan: pan,
  } satisfies RunningTotalChartViewProps
  return (
    <div className="flex flex-col gap-3">
      {activity && <ActivityChart activity={activity} {...shared} />}
      {downloads && <DownloadsChart {...downloads} {...shared} />}
    </div>
  )
}
