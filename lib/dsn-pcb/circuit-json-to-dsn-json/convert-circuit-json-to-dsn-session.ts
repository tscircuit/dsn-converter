import type { AnyCircuitElement, PcbTraceRoutePointWire } from "circuit-json"
import type { DsnPcb, DsnSession, Wire } from "../types"
import { su } from "@tscircuit/soup-util"
import { convertCircuitJsonToDsnJson } from "./convert-circuit-json-to-dsn-json"
import { applyToPoint, scale } from "transformation-matrix"
import { processPcbTraces } from "./process-pcb-traces"

export function convertCircuitJsonToDsnSession(
  dsnPcb: DsnPcb,
  circuitJson: AnyCircuitElement[],
): DsnSession {
  const pcb_traces = su(circuitJson as any).pcb_trace.list()
  const source_traces = su(circuitJson as any).source_trace.list()
  const source_ports = su(circuitJson as any).source_port.list()
  const nets = su(circuitJson as any).source_net.list()

  const transformMmToSesUnit = scale(10000)
  const session: DsnSession = {
    is_dsn_session: true,
    filename: dsnPcb.filename || "session",
    placement: {
      resolution: dsnPcb.resolution,
      components: dsnPcb.placement.components,
    },
    routes: {
      resolution: dsnPcb.resolution,
      parser: dsnPcb.parser,
      library_out: {
        images: [],
        padstacks: [],
      },
      network_out: {
        nets: [],
      },
    },
  }

  processPcbTraces(circuitJson, session)

  return session
}
