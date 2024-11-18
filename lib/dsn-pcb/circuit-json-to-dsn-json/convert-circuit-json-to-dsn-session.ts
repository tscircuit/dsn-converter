import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb, DsnSession } from "../types"
import { su } from "@tscircuit/soup-util"
import { convertCircuitJsonToDsnJson } from "./convert-circuit-json-to-dsn-json"

export function convertCircuitJsonToDsnSession(
  dsnPcb: DsnPcb,
  circuitJson: AnyCircuitElement[],
): DsnSession {
  // First convert to DSN PCB to reuse component/pad processing
  // const dsnPcb = convertCircuitJsonToDsnJson(circuitJson)

  // console.dir(dsnPcb, { depth: null })

  const pcb_traces = su(circuitJson as any).pcb_trace.list()
  const source_traces = su(circuitJson as any).source_trace.list()
  const source_ports = su(circuitJson as any).source_port.list()
  const nets = su(circuitJson as any).source_net.list()

  console.log({
    pcb_traces,
    source_traces,
    source_ports,
    nets,
  })

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
        // TODO Just add vias here
        padstacks: [],
      },
      network_out: {
        nets: dsnPcb.network.nets.map((net) => ({
          name: net.name,
          wires: [], // dsnPcb.wiring.wires.filter((wire) => wire.net === net.name),
        })),
      },
    },
  }

  return session
}
