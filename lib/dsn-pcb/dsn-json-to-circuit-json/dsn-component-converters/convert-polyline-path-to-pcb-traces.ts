import type { PcbTrace } from "circuit-json"
import { chunks } from "lib/utils/chunks"
import { computeSegIntersection } from "lib/utils/compute-seg-intersection"
import { getTraceLength } from "lib/utils/get-trace-length"
import { type Matrix, applyToPoint } from "transformation-matrix"
import type { Wiring } from "../../types"

export const convertPolylinePathToPcbTraces = ({
  wire,
  transformUmToMm,
  netName,
  fromSessionSpace = true,
}: {
  wire: Wiring["wires"][number]
  transformUmToMm: Matrix
  netName: string
  fromSessionSpace?: boolean
}): PcbTrace[] => {
  const traces: PcbTrace[] = []

  const segsUm = chunks(wire.polyline_path!.coordinates, 4).map(
    ([x1, y1, x2, y2]) => ({ x1, y1, x2, y2 }),
  )

  const pointsOnTraceMm: Array<{ x: number; y: number }> = []
  if (segsUm.length === 1) {
    const [seg] = segsUm
    pointsOnTraceMm.push(
      applyToPoint(transformUmToMm, { x: seg.x1, y: seg.y1 }),
    )
    pointsOnTraceMm.push(
      applyToPoint(transformUmToMm, { x: seg.x2, y: seg.y2 }),
    )
  } else {
    for (let i = 0; i < segsUm.length - 1; i++) {
      const intersection = computeSegIntersection(segsUm[i], segsUm[i + 1])
      if (!intersection) continue
      pointsOnTraceMm.push(applyToPoint(transformUmToMm, intersection))
    }
  }

  traces.push({
    type: "pcb_trace",
    pcb_trace_id: `pcb_trace_${netName}`,
    source_trace_id: netName,
    route: pointsOnTraceMm.map((point) => ({
      route_type: "wire" as const,
      x: Number(point.x.toFixed(4)),
      y: Number(point.y.toFixed(4)),
      width: fromSessionSpace
        ? wire.polyline_path!.width / 10000 // session space to circuit space
        : wire.polyline_path!.width / 1000, // dsn space to circuit space
      layer: wire.polyline_path?.layer.includes("B.") ? "bottom" : "top",
    })),
    trace_length: getTraceLength(pointsOnTraceMm),
  })

  return traces
}
