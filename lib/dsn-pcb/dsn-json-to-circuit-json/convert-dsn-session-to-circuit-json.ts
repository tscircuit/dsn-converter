import type {
  AnyCircuitElement,
  PcbTrace,
  PcbTraceRoutePointWire,
} from "circuit-json"
import Debug from "debug"
import { applyToPoint, scale } from "transformation-matrix"
import type { DsnPcb, DsnSession } from "../types"
import { convertDsnPcbToCircuitJson } from "./convert-dsn-pcb-to-circuit-json"
import { convertViaToPcbVia } from "./dsn-component-converters/convert-via-to-pcb-via"
import { convertWiringPathToPcbTraces } from "./dsn-component-converters/convert-wiring-path-to-pcb-traces"

const debug = Debug("dsn-converter")

export function convertDsnSessionToCircuitJson(
  dsnInput: DsnPcb,
  dsnSession: DsnSession,
): AnyCircuitElement[] {
  const transformUmToMm = scale(1 / 10000)
  const inputPcbElms = convertDsnPcbToCircuitJson(dsnInput as DsnPcb)

  // Get existing source traces to maintain proper linkage
  const existingSourceTraces = inputPcbElms.filter(
    (elm) => elm.type === "source_trace",
  )

  const sessionElements: AnyCircuitElement[] = []
  const routeSegments: PcbTrace[] = []

  // Process nets for vias and wires
  for (const net of dsnSession.routes.network_out.nets) {
    // Find corresponding source trace for this net
    const sourceTrace = existingSourceTraces.find((st) => {
      const sourceNetIds = (st as any).connected_source_net_ids || []
      const sourceNet = inputPcbElms.find(
        (elm) =>
          elm.type === "source_net" &&
          elm.name === net.name &&
          sourceNetIds.includes(elm.source_net_id),
      )
      return sourceNet !== undefined
    })

    // Process wires and vias together in routes
    net.wires?.forEach((wire, wireIdx) => {
      if ("path" in wire) {
        routeSegments.push(
          ...convertWiringPathToPcbTraces({
            wire,
            transformUmToMm,
            netName: net.name,
          }),
        )

        const traces = convertWiringPathToPcbTraces({
          wire,
          transformUmToMm,
          netName: net.name,
        })

        // Update trace IDs to maintain proper linkage
        traces.forEach((trace) => {
          trace.source_trace_id = sourceTrace
            ? sourceTrace.source_trace_id
            : `source_trace_${net.name}`
        })

        sessionElements.push(...traces)
      }
    })

    // Get via padstack info if available
    const viaPadstackExists = dsnSession.routes.library_out?.padstacks?.find(
      (p) => p.name === "Via[0-1]_600:300_um",
    )
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
        const connectingWires = sessionElements
          .flatMap((segment) =>
            segment.type === "pcb_trace"
              ? (segment as PcbTrace).route.map((point) => ({
                  ...point,
                  x: Number(point.x.toFixed(4)),
                  y: Number(point.y.toFixed(4)),
                }))
              : [],
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
          x: viaX,
          y: viaY,
          route_type: "via",
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
        sessionElements.push(...routeSegments)
      })
    }
  }

  return [...inputPcbElms, ...sessionElements]
}
