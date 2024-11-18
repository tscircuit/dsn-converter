import type {
  AnyCircuitElement,
  PcbTrace,
  PcbTraceRoutePointWire,
} from "circuit-json"
import { type Matrix, applyToPoint } from "transformation-matrix"
import type { Network, Wiring } from "../../types"
import { convertPolylinePathToPcbTraces } from "./convert-polyline-path-to-pcb-traces"
import { convertWiringPathToPcbTraces } from "./convert-wiring-path-to-pcb-traces"

export function convertWiresToPcbTraces(
  wiring: Wiring,
  network: Network,
  transformUmToMm: Matrix,
): AnyCircuitElement[] {
  const traces: AnyCircuitElement[] = []
  const processedNets = new Set<string>()

  wiring.wires?.forEach((wire) => {
    const netName = wire.net
    if (!netName) return

    if (processedNets.has(netName) || wire.type === "shove_fixed") {
      return
    }
    processedNets.add(netName)

    if ("polyline_path" in wire) {
      traces.push(
        ...convertPolylinePathToPcbTraces({ wire, transformUmToMm, netName }),
      )
      return
    }

    if ("path" in wire) {
      traces.push(
        ...convertWiringPathToPcbTraces({ wire, transformUmToMm, netName }),
      )
      return
    }
  })

  return traces
}
