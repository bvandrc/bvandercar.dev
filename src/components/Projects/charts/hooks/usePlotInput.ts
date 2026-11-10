import { useState } from 'react'
import {
  useZoomPanGestures,
  type ZoomPanGestures,
} from '@bvandrc/react-toolkit/gestures'

export type PlotInputOptions = Omit<ZoomPanGestures, 'getValueAt'> & {
  /** The time at `x` pixels across the plot, which a zoom is anchored at */
  getTimeAtX: (x: number) => number
}

/**
 * The pointer's place across a chart's plot, in pixels from its left edge,
 * with the handlers that track it, to spread onto the plot.
 *
 * Zooms and pans the plot with `useZoomPanGestures` as well. A tap sets the
 * place too, which a finger may not move to first, and a lifted finger leaves
 * it where it was; two fingers pinching leave it be.
 */
export const usePlotInput = (
  plotRef: React.RefObject<Element | null>,
  { getTimeAtX, ...gestures }: PlotInputOptions
) => {
  const [pointerX, setPointerX] = useState<number>()
  /** How far across the plot a pointer at `clientX` is. */
  const toPlotX = (clientX: number) =>
    clientX - (plotRef.current?.getBoundingClientRect().left ?? 0)
  const pinchingRef = useZoomPanGestures(plotRef, {
    getValueAt: (clientX) => getTimeAtX(toPlotX(clientX)),
    ...gestures,
  })
  /** Reads the pointer's place off the event, so it never has to land on anything in particular. */
  const track = (event: React.PointerEvent) =>
    setPointerX(toPlotX(event.clientX))
  const pointerProps = {
    onPointerDown: track,
    onPointerMove: (event: React.PointerEvent) => {
      if (!pinchingRef.current) {
        track(event)
      }
    },
    // A finger always leaves once lifted, so what it pointed at stays read out.
    onPointerLeave: (event: React.PointerEvent) => {
      if (event.pointerType !== 'touch') {
        setPointerX(undefined)
      }
    },
  }
  return { pointerX, pointerProps }
}
