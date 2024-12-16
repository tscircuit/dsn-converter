import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "../types"

export function processPcbTraces(
  circuitElements: AnyCircuitElement[],
  pcb: DsnPcb,
) {
  for (const element of circuitElements) {
    if (element.type === "pcb_trace") {
      const pcbTrace = element

      const netName =
        pcbTrace.source_trace_id || `Net-${pcb.network.nets.length + 1}`

      const wire = {
        path: {
          layer:
            pcbTrace.route[0].route_type === "wire"
              ? pcbTrace.route[0].layer === "top"
                ? "F.Cu"
                : "B.Cu"
              : "F.Cu", // Default to F.Cu if not a wire route
          width:
            pcbTrace.route[0].route_type === "wire"
              ? pcbTrace.route[0].width * 1000
              : 200, // Convert mm to um, or use a default value
          coordinates: [] as number[],
        },
        net: netName,
        type: "route",
      }

      for (const point of pcbTrace.route) {
        wire.path.coordinates.push(point.x * 1000) // Convert mm to um
        wire.path.coordinates.push(point.y * 1000) // Negate Y to match DSN coordinate system
      }

      pcb.wiring.wires.push(wire)
    }
  }
}
