import type {
  AnyCircuitElement,
  PcbTrace,
  PcbTraceRoutePointWire,
} from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import type { Network, Wiring } from "../types"

export function convertWiresToPcbTraces(
  wiring: Wiring,
  network: Network,
  transform: any,
): AnyCircuitElement[] {
  const traces: AnyCircuitElement[] = []
  const processedNets = new Set<string>()

  const POINT_TOLERANCE = 0.001

  function arePointsSimilar(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): boolean {
    return (
      Math.abs(x1 - x2) < POINT_TOLERANCE && Math.abs(y1 - y2) < POINT_TOLERANCE
    )
  }

  function cleanupRoutePoints(
    points: Array<{ x: number; y: number }>,
  ): Array<{ x: number; y: number }> {
    if (points.length <= 1) return points

    const cleanedPoints = [points[0]]

    for (let i = 1; i < points.length; i++) {
      const prevPoint = cleanedPoints[cleanedPoints.length - 1]
      const currentPoint = points[i]

      if (
        !arePointsSimilar(
          prevPoint.x,
          prevPoint.y,
          currentPoint.x,
          currentPoint.y,
        )
      ) {
        cleanedPoints.push(currentPoint)
      }
    }

    return cleanedPoints
  }

  wiring.wires?.forEach((wire) => {
    const netName = wire.net

    if (processedNets.has(netName) || wire.type === "shove_fixed") {
      return
    }

    const pathInfo = wire.polyline_path || wire.path
    if (!pathInfo?.coordinates) return

    processedNets.add(netName)

    // Convert coordinates to circuit space using the transformation matrix
    const points: Array<{ x: number; y: number }> = []
    for (let i = 0; i < pathInfo.coordinates.length; i += 2) {
      const x = pathInfo.coordinates[i]
      const y = pathInfo.coordinates[i + 1]

      if (x !== undefined && y !== undefined) {
        const circuitPoint = applyToPoint(transform, { x, y })
        // Hot fix for points that are too far away
        //   if (Math.abs(circuitPoint.x) > 100 || Math.abs(circuitPoint.y) > 100) continue;
        points.push(circuitPoint)
      }
    }

    // Clean up points to remove duplicates
    const cleanedPoints = cleanupRoutePoints(points)

    if (cleanedPoints.length >= 2) {
      const routePoints = cleanedPoints.map((point) => ({
        route_type: "wire" as const,
        x: Number(point.x.toFixed(4)),
        y: Number(point.y.toFixed(4)),
        width: 0.2, // Standard trace width in circuit space
        layer: pathInfo.layer.includes("F.") ? "top" : "bottom",
      }))

      const pcbTrace: PcbTrace = {
        type: "pcb_trace",
        pcb_trace_id: `trace_${netName}_${Math.random().toString(36).substr(2, 9)}`,
        source_trace_id: netName,
        route_thickness_mode: "constant",
        should_round_corners: false,
        route: routePoints as PcbTraceRoutePointWire[],
      }

      traces.push(pcbTrace)
    }
  })

  return traces
}
