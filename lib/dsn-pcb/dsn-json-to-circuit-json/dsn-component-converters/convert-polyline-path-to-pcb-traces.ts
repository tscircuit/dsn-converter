import type { PcbTrace } from "circuit-json"
import type { Wiring } from "../../types"
import { type Matrix, applyToPoint } from "transformation-matrix"
import { chunks } from "lib/utils/chunks"
import { computeSegIntersection } from "lib/utils/compute-seg-intersection"

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
    pcb_trace_id: `trace_${netName}_${Math.random().toString(36).substr(2, 9)}`,
    source_trace_id: netName,
    route_thickness_mode: "constant",
    should_round_corners: false,
    route: pointsOnTraceMm.map((point) => ({
      route_type: "wire" as const,
      x: Number(point.x.toFixed(4)),
      y: Number(point.y.toFixed(4)),
      width: 0.2, // Standard trace width in circuit space
      layer: wire.polyline_path?.layer.includes("B.") ? "bottom" : "top",
    })),
  })

  return traces
}