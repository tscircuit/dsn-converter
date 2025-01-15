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
import { su } from "@tscircuit/soup-util"

const debug = Debug("dsn-converter")

export function convertDsnSessionToCircuitJson(
  dsnInput: DsnPcb,
  dsnSession: DsnSession,
  circuitJson?: AnyCircuitElement[],
): AnyCircuitElement[] {
  const transformUmToMm = scale(1 / 10000)
  const inputPcbElms = convertDsnPcbToCircuitJson(dsnInput as DsnPcb)

  // Get existing source traces to maintain proper linkage
  const existingSourceTraces = inputPcbElms.filter(
    (elm) => elm.type === "source_trace",
  )

  // The source_trace_id is not correctly set in the existing source_trace elements
  if (circuitJson) {
    existingSourceTraces.forEach((st) => {
      // Process all connected source port IDs
      for (const portId of st.connected_source_port_ids) {
        const [pad_number, source_port_component_name] =
          portId.split("-").pop()?.split("_") ?? []
        const pin_number = parseInt(pad_number.replace("Pad", ""))

        const source_port_component = su(circuitJson)
          .source_component.list()
          .find((elm) => elm.name === source_port_component_name)
        const source_ports = su(circuitJson)
          .source_port.list()
          .filter(
            (elm) =>
              elm.source_component_id ===
                source_port_component?.source_component_id &&
              elm.pin_number === pin_number,
          )
        // Find the source_trace connecting the source_port
        const source_trace = su(circuitJson)
          .source_trace.list()
          .find((elm) =>
            elm.connected_source_port_ids.some((id) =>
              source_ports.some((sp) => sp.source_port_id === id),
            ),
          )
        if (source_trace) {
          st.source_trace_id = source_trace.source_trace_id
          break
        }
      }
      // If no source_trace was found, use the first port ID as fallback
      if (!st.source_trace_id) {
        st.source_trace_id = `source_trace_${st.connected_source_port_ids[0]}`
      }
    })
  }

  const sessionElements: AnyCircuitElement[] = []
  const routeSegments: PcbTrace[] = []

  // Process nets for vias and wires
  for (const net of dsnSession.routes.network_out.nets) {
    // Find corresponding source trace for this net
    const sourceTrace = existingSourceTraces.find((st) => {
      const sourceNetIds = (st as any).connected_source_net_ids || []
      const sourceNet = inputPcbElms.find((elm) => {
        if (elm.type === "source_net") {
          if (elm.name.startsWith("Net")) {
            // For connected nets (Net-1, Net-2, etc.)
            const modifiedName = elm.name.replace(/_source_component_.+?-/, "-")
            return (
              elm.type === "source_net" &&
              modifiedName === net.name &&
              sourceNetIds.includes(elm.source_net_id)
            )
          } else {
            // For GND,VCC etc
            const modifiedName = elm.name.split("_")[0]
            return (
              elm.type === "source_net" &&
              modifiedName === net.name &&
              sourceNetIds.includes(elm.source_net_id)
            )
          }
        }
      })
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

        // Add via point to each trace that connects to it
        sessionElements.forEach((element) => {
          if (element.type === "pcb_trace") {
            const trace = element as PcbTrace
            const lastPoint = trace.route[trace.route.length - 1]
            if (lastPoint && lastPoint.x === viaX && lastPoint.y === viaY) {
              trace.route.push({
                x: viaX,
                y: viaY,
                route_type: "via",
                from_layer: fromLayer,
                to_layer: toLayer,
              })
            }
          }
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
  }

  return [...inputPcbElms, ...sessionElements]
}
