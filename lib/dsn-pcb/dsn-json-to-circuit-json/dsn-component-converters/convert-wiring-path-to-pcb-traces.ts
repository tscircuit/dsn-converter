import type {
  AnyCircuitElement,
  PcbTrace,
  PcbTraceRoutePointWire,
} from "circuit-json"
import { type Matrix, applyToPoint } from "transformation-matrix"
import type { Wiring } from "../../types"
import Debug from "debug"

const debug = Debug("dsn-converter:convertWiringPathToPcbTraces")

export const convertWiringPathToPcbTraces = ({
  wire,
  transformUmToMm,
  netName,
}: {
  wire: Wiring["wires"][number]
  transformUmToMm: Matrix
  netName: string
}): PcbTrace[] => {
  const coordinates = wire.path!.coordinates
  // Convert coordinates to circuit space using the transformation matrix
  const points: Array<{ x: number; y: number }> = []
  for (let i = 0; i < coordinates.length; i += 2) {
    const x = coordinates[i]
    const y = coordinates[i + 1]

    if (x !== undefined && y !== undefined) {
      const circuitPoint = applyToPoint(transformUmToMm, { x, y })
      // Hot fix for points that are too far away
      //   if (Math.abs(circuitPoint.x) > 100 || Math.abs(circuitPoint.y) > 100) continue;
      points.push(circuitPoint)
    }
  }

  if (points.length >= 2) {
    const routePoints = points.map((point) => ({
      route_type: "wire" as const,
      x: Number(point.x.toFixed(4)),
      y: Number(point.y.toFixed(4)),
      width: 0.16, // Standard trace width in circuit space
      layer: wire.path!.layer.includes("F.") ? "top" : "bottom",
    }))

    const pcbTrace: PcbTrace = {
      type: "pcb_trace",
      pcb_trace_id: `pcb_trace_${netName}`,
      source_trace_id: netName,
      route: routePoints as PcbTraceRoutePointWire[],
    }
    return [pcbTrace]
  }

  return []
}
