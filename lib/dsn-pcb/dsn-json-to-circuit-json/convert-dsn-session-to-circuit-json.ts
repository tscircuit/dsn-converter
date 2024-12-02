import type { AnyCircuitElement, PcbTrace } from "circuit-json"
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
    const viaPadstack = dsnSession.routes.library_out?.padstacks?.find(
      (p) => p.name === "Via[0-1]_600:300_um",
    )

    // Process wires and vias together in routes
    net.wires?.forEach((wire) => {
      if ("path" in wire) {
        // Create route segments array
        const routeSegments: PcbTrace[] = []

        // Add wire segments
        routeSegments.push(
          ...convertWiringPathToPcbTraces({
            wire,
            transformUmToMm,
            netName: net.name,
          }),
        )

        // Add associated vias if they exist at wire endpoints
        if (viaPadstack && net.vias && net.vias.length > 0) {
          net.vias.forEach((via) => {
            const viaPoint = applyToPoint(transformUmToMm, {
              x: via.x,
              y: via.y,
            })
            sessionElements.push({
              ...convertViaToPcbVia({
                x: Number(viaPoint.x.toFixed(4)),
                y: Number(viaPoint.y.toFixed(4)),
                netName: net.name,
              })
            })
            routeSegments[0].route.push({
              route_type: "via" as const,
              x: Number(viaPoint.x.toFixed(4)),
              y: Number(viaPoint.y.toFixed(4)),
              from_layer: "top",
              to_layer: "bottom",
            })
          })
        }

        sessionElements.push(...routeSegments)
      }
    })
  }

  return [...inputPcbElms, ...sessionElements]
}
