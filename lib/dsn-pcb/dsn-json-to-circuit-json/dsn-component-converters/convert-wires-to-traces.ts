import type {
  AnyCircuitElement,
  PcbTrace,
  PcbTraceRoutePointWire,
} from "circuit-json"
import Debug from "debug"
import { type Matrix, applyToPoint } from "transformation-matrix"
import type { Network, Wiring } from "../../types"
import { convertPolylinePathToPcbTraces } from "./convert-polyline-path-to-pcb-traces"
import { convertWiringPathToPcbTraces } from "./convert-wiring-path-to-pcb-traces"
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
  const netTraceCounts = new Map<string, number>()
  const netViaCounts = new Map<string, number>()

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
      const netViaIndex = netViaCounts.get(netName) ?? 0
      netViaCounts.set(netName, netViaIndex + 1)
      const viaIdSuffix = netViaIndex === 0 ? "" : `_${netViaIndex}`

      debug("wire is actually a via!")
      tracesAndVias.push(
        ...convertWiringViaToPcbVias({
          wire,
          transformUmToMm,
          netName,
          pcbViaId: `pcb_via_${netName}${viaIdSuffix}`,
        }),
      )
      return
    }

    if ("polyline_path" in wire) {
      const netTraceIndex = netTraceCounts.get(netName) ?? 0
      netTraceCounts.set(netName, netTraceIndex + 1)
      const traceIdSuffix = netTraceIndex === 0 ? "" : `_${netTraceIndex}`

      tracesAndVias.push(
        ...convertPolylinePathToPcbTraces({
          wire,
          transformUmToMm,
          netName,
          pcbTraceId: `pcb_trace_${netName}${traceIdSuffix}`,
          fromSessionSpace,
        }),
      )
      return
    }

    if ("path" in wire) {
      const netTraceIndex = netTraceCounts.get(netName) ?? 0
      netTraceCounts.set(netName, netTraceIndex + 1)
      const traceIdSuffix = netTraceIndex === 0 ? "" : `_${netTraceIndex}`

      tracesAndVias.push(
        ...convertWiringPathToPcbTraces({
          wire,
          transformUmToMm,
          netName,
          pcbTraceId: `pcb_trace_${netName}${traceIdSuffix}`,
          fromSessionSpace,
        }),
      )
      return
    }
  })

  return tracesAndVias
}
