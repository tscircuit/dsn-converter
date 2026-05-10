import type {
  AnyCircuitElement,
  PcbTrace,
  PcbTraceRoutePointWire,
} from "circuit-json"
import Debug from "debug"
import { type Matrix, applyToPoint } from "transformation-matrix"
import type { DsnPcb, Network, Wiring } from "../../types"
import { convertPolylinePathToPcbTraces } from "./convert-polyline-path-to-pcb-traces"
import { convertWiringPathToPcbTraces } from "./convert-wiring-path-to-pcb-traces"
import { convertWiringViaToPcbVias } from "./convert-wiring-via-to-pcb-vias"
import { parseViaSize } from "../../utils/parse-via-size"

const debug = Debug("dsn-converter:convertWiresToPcbTraces")

export function convertWiresToPcbTraces(
  wiring: Wiring,
  network: Network,
  transformUmToMm: Matrix,
  dsnPcb: DsnPcb,
  fromSessionSpace?: boolean,
): AnyCircuitElement[] {
  const tracesAndVias: AnyCircuitElement[] = []
  const viaCountByNet: Record<string, number> = {}
  const traceCountByNet: Record<string, number> = {}

  const viaSize = dsnPcb.structure?.via ? parseViaSize(dsnPcb.structure.via) : null

  wiring.wires?.forEach((wire) => {
    debug("WIRE\n----\n", wire)
    const netName = wire.net
    if (!netName) return

    if (wire.type === "shove_fixed") {
      return
    }
    
    // We don't want to skip traces for already processed nets because multiple 
    // wire segments can belong to the same net.
    // processedNets.add(netName)

    if (wire.type === "via") {
      debug("wire is actually a via!")
      const index = viaCountByNet[netName] || 0
      viaCountByNet[netName] = index + 1
      tracesAndVias.push(
        ...convertWiringViaToPcbVias({ 
          wire, 
          transformUmToMm, 
          netName,
          outerDiameter: viaSize?.outerDiameter,
          holeDiameter: viaSize?.holeDiameter,
          index,
        }),
      )
      return
    }

    if ("polyline_path" in wire) {
      const index = traceCountByNet[netName] || 0
      traceCountByNet[netName] = index + 1
      tracesAndVias.push(
        ...convertPolylinePathToPcbTraces({
          wire,
          transformUmToMm,
          netName,
          fromSessionSpace,
          index,
        }),
      )
      return
    }

    if ("path" in wire) {
      const index = traceCountByNet[netName] || 0
      traceCountByNet[netName] = index + 1
      tracesAndVias.push(
        ...convertWiringPathToPcbTraces({
          wire,
          transformUmToMm,
          netName,
          fromSessionSpace,
          index,
        }),
      )
      return
    }
  })

  return tracesAndVias
}
