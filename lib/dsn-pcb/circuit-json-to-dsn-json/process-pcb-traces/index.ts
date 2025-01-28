import type {
  AnyCircuitElement,
  LayerRef,
  PcbTrace,
  PcbTraceRoutePoint,
} from "circuit-json"
import type { DsnPcb, DsnSession } from "../../types"
import Debug from "debug"
import { findOrCreateViaPadstack } from "./findOrCreateViaPadstack"
import { getDsnTraceOperationsWrapper } from "./DsnTraceOperationsWrapper"
import { su } from "@tscircuit/soup-util"
import { getCombinedSourcePortName } from "lib/utils/get-combined-source-port-name"

const debug = Debug("dsn-converter:processPcbTraces")

const DEFAULT_VIA_DIAMETER = 600 // μm
const DEFAULT_VIA_HOLE = 300 // μm

interface Wire {
  path: {
    layer: string
    width: number
    coordinates: number[]
  }
  net: string
  type: string
}

function createWire(opts: {
  layer: LayerRef
  widthMm: number
  netName: string
}): Wire {
  return {
    path: {
      layer: opts.layer === "top" ? "F.Cu" : "B.Cu",
      width: opts.widthMm * 1000,
      coordinates: [],
    },
    net: opts.netName,
    type: "route",
  }
}

export function processPcbTraces(
  circuitElements: AnyCircuitElement[],
  pcb: DsnPcb | DsnSession,
) {
  const dsnWrapper = getDsnTraceOperationsWrapper(pcb)
  const CJ_TO_DSN_SCALE = pcb.is_dsn_pcb ? 1000 : 10000

  for (const element of circuitElements) {
    if (element.type === "pcb_trace") {
      const pcbTrace = element
      const source_trace = su(circuitElements).source_trace.getWhere({
        source_trace_id: pcbTrace.source_trace_id,
      })
      const source_net =
        source_trace &&
        su(circuitElements)
          .source_net.list()
          .find((n) =>
            source_trace.connected_source_net_ids.includes(n.source_net_id),
          )
      debug("PCB TRACE\n----------\n", pcbTrace)
      const sourceTraceConnectedPortIds = getCombinedSourcePortName(
        circuitElements,
        source_trace?.connected_source_port_ids || [],
      )
      const netName =
        source_net?.name ||
        `${pcbTrace.source_trace_id}--${sourceTraceConnectedPortIds}` ||
        dsnWrapper.getNextNetId()

      let currentLayer = ""
      let currentWire: Wire | null = null

      // Process each point in the route
      for (let i = 0; i < pcbTrace.route.length; i++) {
        const point = pcbTrace.route[i] as PcbTraceRoutePoint
        debug("POINT\n------\n", point)

        if (point.route_type === "wire") {
          // If layer changed or this is the first point, start a new wire
          const hasLayerChanged = currentLayer && point.layer !== currentLayer
          const isFirstPoint = !currentWire

          if (isFirstPoint) {
            // Start new wire on new layer
            currentWire = createWire({
              layer: point.layer,
              widthMm: point.width,
              netName,
            })

            dsnWrapper.addWire(currentWire)
            currentLayer = point.layer
          }

          if (currentWire && !hasLayerChanged) {
            // Add coordinates to current wire
            currentWire.path.coordinates.push(point.x * CJ_TO_DSN_SCALE)
            currentWire.path.coordinates.push(point.y * CJ_TO_DSN_SCALE)
            continue
          }

          if (hasLayerChanged) {
            const prevPoint = pcbTrace.route[i - 1]
            const viaPadstackName = findOrCreateViaPadstack(
              dsnWrapper,
              DEFAULT_VIA_DIAMETER,
              DEFAULT_VIA_HOLE,
            )

            // Add via reference to structure if not already there
            if (dsnWrapper.getStructure() && !dsnWrapper.getStructure()?.via) {
              dsnWrapper.getStructure()!.via = viaPadstackName
            }

            // Create wire segment for via placement
            dsnWrapper.addWire({
              path: {
                layer: currentLayer === "top" ? "F.Cu" : "B.Cu",
                width: DEFAULT_VIA_DIAMETER,
                coordinates: [
                  prevPoint.x * CJ_TO_DSN_SCALE,
                  prevPoint.y * CJ_TO_DSN_SCALE,
                ],
              },
              net: netName,
              type: "via",
            })
          }
          continue
        }

        if (point.route_type === "via") {
          debug("VIA\n----\n", point)

          // End current wire
          if (currentWire) {
            currentWire.path.coordinates.push(point.x * CJ_TO_DSN_SCALE)
            currentWire.path.coordinates.push(point.y * CJ_TO_DSN_SCALE)
            currentWire = null
          }

          // Handle explicit via points
          const viaPadstackName = findOrCreateViaPadstack(
            dsnWrapper,
            DEFAULT_VIA_DIAMETER,
            DEFAULT_VIA_HOLE,
          )

          debug("VIA PADSTACK NAME:", viaPadstackName)

          // Add via reference to structure if not already there
          if (dsnWrapper.getStructure() && !dsnWrapper.getStructure()?.via) {
            dsnWrapper.getStructure()!.via = viaPadstackName
          }

          // Create wire segment for via placement
          dsnWrapper.addWire({
            path: {
              layer: point.from_layer === "top" ? "F.Cu" : "B.Cu",
              width: DEFAULT_VIA_DIAMETER,
              coordinates: [
                point.x * CJ_TO_DSN_SCALE,
                point.y * CJ_TO_DSN_SCALE,
              ],
            },
            net: netName,
            type: "via",
          })

          currentLayer = point.to_layer
          currentWire = null // Start fresh wire after via
        }
      }
    }
  }
  debug(
    "PCB WIRING/NETWORK_OUT AT END",
    JSON.stringify(
      pcb.is_dsn_pcb ? pcb.wiring : pcb.routes.network_out.nets,
      null,
      2,
    ),
  )
}
