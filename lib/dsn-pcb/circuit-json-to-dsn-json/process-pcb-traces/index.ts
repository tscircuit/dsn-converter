import type {
  AnyCircuitElement,
  LayerRef,
  PcbTrace,
  PcbTraceRoutePoint,
} from "circuit-json"
import type { DsnPcb } from "../../types"
import Debug from "debug"
import { findOrCreateViaPadstack } from "./findOrCreateViaPadstack"

const debug = Debug("dsn-converter:process-pcb-traces")

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
  pcb: DsnPcb,
) {
  for (const element of circuitElements) {
    if (element.type === "pcb_trace") {
      const pcbTrace = element
      debug("PCB TRACE\n----------\n", pcbTrace)
      const netName =
        pcbTrace.source_trace_id || `Net-${pcb.network.nets.length + 1}`

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

            pcb.wiring.wires.push(currentWire)
            currentLayer = point.layer
          }

          if (currentWire && !hasLayerChanged) {
            // Add coordinates to current wire
            currentWire.path.coordinates.push(point.x * 1000)
            currentWire.path.coordinates.push(point.y * 1000)
            continue
          }

          if (hasLayerChanged) {
            const prevPoint = pcbTrace.route[i - 1]
            const viaPadstackName = findOrCreateViaPadstack(
              pcb,
              DEFAULT_VIA_DIAMETER,
              DEFAULT_VIA_HOLE,
            )

            // Add via reference to structure if not already there
            if (!pcb.structure.via) {
              pcb.structure.via = viaPadstackName
            }

            // Create wire segment for via placement
            pcb.wiring.wires.push({
              path: {
                layer: currentLayer === "top" ? "F.Cu" : "B.Cu",
                width: DEFAULT_VIA_DIAMETER,
                coordinates: [prevPoint.x * 1000, prevPoint.y * 1000],
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
            currentWire.path.coordinates.push(point.x * 1000)
            currentWire.path.coordinates.push(point.y * 1000)
            currentWire = null
          }

          // Handle explicit via points
          const viaPadstackName = findOrCreateViaPadstack(
            pcb,
            DEFAULT_VIA_DIAMETER,
            DEFAULT_VIA_HOLE,
          )

          debug("VIA PADSTACK NAME:", viaPadstackName)

          // Add via reference to structure if not already there
          if (!pcb.structure.via) {
            pcb.structure.via = viaPadstackName
          }

          // Create wire segment for via placement
          pcb.wiring.wires.push({
            path: {
              layer: point.from_layer === "top" ? "F.Cu" : "B.Cu",
              width: DEFAULT_VIA_DIAMETER,
              coordinates: [point.x * 1000, point.y * 1000],
            },
            net: netName,
            type: "via",
          })
          debug("WIRING", pcb.wiring)

          currentLayer = point.to_layer
          currentWire = null // Start fresh wire after via
        }
      }
    }
  }
  debug("PCB WIRING AT END", pcb.wiring)
}
