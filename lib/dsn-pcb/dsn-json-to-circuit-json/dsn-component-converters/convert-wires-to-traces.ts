import type {
  AnyCircuitElement,
  PcbTrace,
  PcbTraceRoutePointWire,
} from "circuit-json"
import { type Matrix, applyToPoint } from "transformation-matrix"
import type { Network, Wiring } from "../../types"
import { convertPolylinePathToPcbTraces } from "./convert-polyline-path-to-pcb-traces"
import { convertWiringPathToPcbTraces } from "./convert-wiring-path-to-pcb-traces"
import Debug from "debug"
import { convertWiringViaToPcbVias } from "./convert-wiring-via-to-pcb-vias"

const debug = Debug("dsn-converter:convertWiresToPcbTraces")

export function convertWiresToPcbTraces(
  wiring: Wiring,
  network: Network,
  transformUmToMm: Matrix,
  fromSessionSpace?: boolean,
): AnyCircuitElement[] {
  const tracesAndVias: AnyCircuitElement[] = []
  const processedNets = new Set<string>()

  wiring.wires?.forEach((wire) => {
    debug("WIRE\n----\n", wire)
    const netName = wire.net
    if (!netName) return

    if (wire.type === "shove_fixed") {
      return
    }
    if (processedNets.has(netName)) {
      debug(
        `Already processed wire for net "${netName}" but got another (hopefully not a duplicate wire!)`,
      )
    }
    processedNets.add(netName)

    if (wire.type === "via") {
      debug("wire is actually a via!")
      tracesAndVias.push(
        ...convertWiringViaToPcbVias({ wire, transformUmToMm, netName }),
      )
      return
    }

    if ("polyline_path" in wire) {
      tracesAndVias.push(
        ...convertPolylinePathToPcbTraces({
          wire,
          transformUmToMm,
          netName,
          fromSessionSpace,
        }),
      )
      return
    }

    if ("path" in wire) {
      tracesAndVias.push(
        ...convertWiringPathToPcbTraces({
          wire,
          transformUmToMm,
          netName,
          fromSessionSpace,
        }),
      )
      return
    }
  })

  return tracesAndVias
}
