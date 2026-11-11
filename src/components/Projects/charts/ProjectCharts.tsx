import { useState } from 'react'

import type { ActivityHistory, DownloadHistory, Registry } from '~/counts'
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
  /** The dates both charts open zoomed in on, inside `span`; without it, they open zoomed all the way out */
  initialSpan?: DaySpan
  /** The history whose commits it charts */
  activity?: ActivityHistory
  /** The history whose merged PRs it charts */
  prs?: ActivityHistory
  /** The downloads it charts, and the registry they're from, if only one */
  downloads?: { registry?: Registry; history: DownloadHistory }
}

/**
 * A project's commits chart, merged PRs chart, then its package's downloads
 * chart, whichever it has, sharing one span, zoom, and set of releases.
 *
 * Mounted with the tooltip it sits in, so each opening starts at
 * `initialSpan`, or zoomed all the way out.
 * Loaded on its own, with the histories it charts, the first time a
 * project's counts are hovered, so neither the charts' code, gestures
 * included, nor their data is in the page's first load.
 */
export const ProjectCharts = ({
  activity,
  prs,
  downloads,
  span: fullSpan,
  initialSpan,
  releases,
}: ProjectChartsProps) => {
  // Shared by both charts, so a release stays lined up across them as they zoom.
  const [zoomedSpan, setZoomedSpan] = useState(initialSpan)
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
      {activity && (
        <ActivityChart activity={activity} kind="commits" {...shared} />
      )}
      {prs && <ActivityChart activity={prs} kind="prs" {...shared} />}
      {downloads && <DownloadsChart {...downloads} {...shared} />}
    </div>
  )
}
