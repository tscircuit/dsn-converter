import type { AnyCircuitElement, PcbTraceRoutePoint } from "circuit-json"
import type { DsnPcb, Padstack } from "../types"

const DEFAULT_VIA_DIAMETER = 600 // μm
const DEFAULT_VIA_HOLE = 300 // μm

function findOrCreateViaPadstack(
  pcb: DsnPcb,
  outerDiameter: number,
  holeDiameter: number,
): string {
  const viaName = `Via[0-1]_${outerDiameter}:${holeDiameter}_um`

  // Check if padstack already exists
  const existingPadstack = pcb.library.padstacks.find((p) => p.name === viaName)

  if (existingPadstack) {
    return viaName
  }

  // Create new padstack for via
  const viaPadstack: Padstack = {
    name: viaName,
    attach: "off",
    shapes: [
      {
        shapeType: "circle",
        layer: "F.Cu",
        diameter: outerDiameter,
      },
      {
        shapeType: "circle",
        layer: "B.Cu",
        diameter: outerDiameter,
      },
    ],
    hole: {
      shape: "circle",
      diameter: holeDiameter,
    },
  }

  pcb.library.padstacks.push(viaPadstack)
  return viaName
}

export function processPcbTraces(
  circuitElements: AnyCircuitElement[],
  pcb: DsnPcb,
) {
  for (const element of circuitElements) {
    if (element.type === "pcb_trace") {
      const pcbTrace = element

      const netName =
        pcbTrace.source_trace_id || `Net-${pcb.network.nets.length + 1}`

      let currentLayer = ""
      let currentWire: {
        path: {
          layer: string
          width: number
          coordinates: number[]
        }
        net: string
        type: string
      } | null = null

      // Process each point in the route
      for (let i = 0; i < pcbTrace.route.length; i++) {
        const point = pcbTrace.route[i] as PcbTraceRoutePoint

        if (point.route_type === "wire") {
          // If layer changed or this is the first point, start a new wire
          if (point.layer !== currentLayer || !currentWire) {
            // If there was a previous wire and layer changed, create a via
            if (currentWire && point.layer !== currentLayer) {
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

            // Start new wire on new layer
            currentWire = {
              path: {
                layer: point.layer === "top" ? "F.Cu" : "B.Cu",
                width: point.width * 1000, // Convert mm to um
                coordinates: [],
              },
              net: netName,
              type: "route",
            }
            pcb.wiring.wires.push(currentWire)
            currentLayer = point.layer
          }

          // Add coordinates to current wire
          currentWire.path.coordinates.push(point.x * 1000)
          currentWire.path.coordinates.push(point.y * 1000)
        } else if (point.route_type === "via") {
          // Handle explicit via points
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
              layer: point.from_layer === "top" ? "F.Cu" : "B.Cu",
              width: DEFAULT_VIA_DIAMETER,
              coordinates: [point.x * 1000, point.y * 1000],
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
}
