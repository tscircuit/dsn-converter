import type {
  AnyCircuitElement,
  PcbTrace,
  PcbTraceRoutePointWire,
} from "circuit-json"
import Debug from "debug"
import { scale } from "transformation-matrix"
import type { DsnPcb, DsnSession } from "../types"
import { convertDsnPcbToCircuitJson } from "./convert-dsn-pcb-to-circuit-json"
import { convertWiringPathToPcbTraces } from "./dsn-component-converters/convert-wiring-path-to-pcb-traces"
import { applyToPoint } from "transformation-matrix"
import { convertViaToPcbVia } from "./dsn-component-converters/convert-via-to-pcb-via"

const debug = Debug("dsn-converter")

export function convertDsnSessionToCircuitJson(
  dsnInput: DsnPcb,
  dsnSession: DsnSession,
): AnyCircuitElement[] {
  // 1mm is 10000um in Ses file
  const transformUmToMm = scale(1 / 10000)

  if (debug.enabled) {
    Bun.write("dsn-session.json", JSON.stringify(dsnSession, null, 2))
  }

  const inputPcbElms = convertDsnPcbToCircuitJson(dsnInput as DsnPcb)

  // Process vias and wires from the session
  const sessionElements: AnyCircuitElement[] = []

  // Process nets for vias and wires
  for (const net of dsnSession.routes.network_out.nets) {
    // Get via padstack info if available
    const viaPadstackExists = dsnSession.routes.library_out?.padstacks?.find(
      (p) => p.name === "Via[0-1]_600:300_um",
    )
    // Create route segments array
    const routeSegments: PcbTrace[] = []
    // Process wires and vias together in routes
    net.wires?.forEach((wire) => {
      if ("path" in wire) {
        // Add wire segments
        routeSegments.push(
          ...convertWiringPathToPcbTraces({
            wire,
            transformUmToMm,
            netName: net.name,
          }),
        )
      }
    })

    // Add associated vias if they exist at wire endpoints
    if (viaPadstackExists && net.vias && net.vias.length > 0) {
      net.vias.forEach((via) => {
        const viaPoint = applyToPoint(transformUmToMm, {
          x: via.x,
          y: via.y,
        })
        const viaX = Number(viaPoint.x.toFixed(4))
        const viaY = Number(viaPoint.y.toFixed(4))

        // Find the wire points that connect to this via across all route segments
        const connectingWires = routeSegments
          .flatMap((segment) =>
            segment.route.map((point) => ({
              ...point,
              x: Number(point.x.toFixed(4)),
              y: Number(point.y.toFixed(4)),
            })),
          )
          .filter(
            (point) =>
              point.route_type === "wire" &&
              point.x === viaX &&
              point.y === viaY,
          ) as PcbTraceRoutePointWire[]

        // Get the layers from the connecting wires
        const fromLayer = connectingWires[0]?.layer || "top"
        const toLayer = connectingWires[1]?.layer || "bottom"

        routeSegments[0].route.push({
          route_type: "via" as const,
          x: viaX,
          y: viaY,
          from_layer: fromLayer,
          to_layer: toLayer,
        })

        sessionElements.push({
          ...convertViaToPcbVia({
            x: viaX,
            y: viaY,
            netName: net.name,
            fromLayer,
            toLayer,
          }),
        })
      })
    }
    sessionElements.push(...routeSegments)
  }

  return [...inputPcbElms, ...sessionElements]
}
