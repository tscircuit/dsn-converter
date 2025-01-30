import type { PcbTrace } from "circuit-json"
import type { Wiring } from "../../types"
import { type Matrix, applyToPoint } from "transformation-matrix"
import { chunks } from "lib/utils/chunks"
import { computeSegIntersection } from "lib/utils/compute-seg-intersection"
import { getTraceLength } from "lib/utils/get-trace-length"

export const convertPolylinePathToPcbTraces = ({
  wire,
  transformUmToMm,
  netName,
}: {
  wire: Wiring["wires"][number]
  transformUmToMm: Matrix
  netName: string
}): PcbTrace[] => {
  const traces: PcbTrace[] = []

  const segsUm = chunks(wire.polyline_path!.coordinates, 4).map(
    ([x1, y1, x2, y2]) => ({ x1, y1, x2, y2 }),
  )

  const pointsOnTraceMm: Array<{ x: number; y: number }> = []
  for (let i = 0; i < segsUm.length - 1; i++) {
    const intersection = computeSegIntersection(segsUm[i], segsUm[i + 1])
    if (!intersection) continue
    pointsOnTraceMm.push(applyToPoint(transformUmToMm, intersection))
  }

  traces.push({
    type: "pcb_trace",
    pcb_trace_id: `pcb_trace_${netName}`,
    source_trace_id: netName,
    route: pointsOnTraceMm.map((point) => ({
      route_type: "wire" as const,
      x: Number(point.x.toFixed(4)),
      y: Number(point.y.toFixed(4)),
      width: 0.16, // Standard trace width in circuit space
      layer: wire.polyline_path?.layer.includes("B.") ? "bottom" : "top",
    })),
    trace_length: getTraceLength(pointsOnTraceMm),
  })

  return traces
}
