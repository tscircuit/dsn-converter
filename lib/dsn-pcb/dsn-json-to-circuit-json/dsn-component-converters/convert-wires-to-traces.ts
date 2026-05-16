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
  let viaCount = 0
  let traceCount = 0

  wiring.wires?.forEach((wire) => {
    debug("WIRE\n----\n", wire)
    const netName = wire.net
    if (!netName) return

    if (wire.type === "shove_fixed") {
      return
    }

    if (wire.type === "via") {
      debug("wire is actually a via!")
      tracesAndVias.push(
        ...convertWiringViaToPcbVias({
          wire,
          transformUmToMm,
          netName,
          index: viaCount++,
        }),
      )
      return
    }

    if ("polyline_path" in wire) {
      const traces = convertPolylinePathToPcbTraces({
        wire,
        transformUmToMm,
        netName,
        fromSessionSpace,
      })
      // Ensure unique IDs for traces if they don't have them
      traces.forEach((t) => {
        if (t.type === "pcb_trace") {
          t.pcb_trace_id = `${t.pcb_trace_id}_${traceCount++}`
        }
      })
      tracesAndVias.push(...traces)
      return
    }

    if ("path" in wire) {
      const traces = convertWiringPathToPcbTraces({
        wire,
        transformUmToMm,
        netName,
        fromSessionSpace,
      })
      traces.forEach((t) => {
        if (t.type === "pcb_trace") {
          t.pcb_trace_id = `${t.pcb_trace_id}_${traceCount++}`
        }
      })
      tracesAndVias.push(...traces)
      return
    }
  })

  return tracesAndVias
}
