import type { AnyCircuitElement, PcbTraceRoutePointWire } from "circuit-json"
import type { DsnPcb, DsnSession, Wire } from "../types"
import { su } from "@tscircuit/soup-util"
import { convertCircuitJsonToDsnJson } from "./convert-circuit-json-to-dsn-json"
import { applyToPoint, scale } from "transformation-matrix"

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
        // TODO Just add vias here
        padstacks: [],
      },
      network_out: {
        nets: dsnPcb.network.nets
          .map((net) => {
            const source_net = nets.find((n) => n.name === net.name)
            if (!source_net) return null
            const pcb_traces_for_net = pcb_traces.filter((pcb_trace) => {
              const source_trace = source_traces.find(
                (st) => st.source_trace_id === pcb_trace.source_trace_id,
              )

              return source_trace?.connected_source_net_ids.includes(
                source_net.source_net_id,
              )
            })

            return {
              name: net.name,
              wires: pcb_traces_for_net.flatMap((trace): Wire => {
                // TODO whenever the pcb trace changes layers or changes width,
                // we have to create a new wire
                return {
                  path: {
                    layer: "F.Cu",
                    width: 0.1, // TODO get width
                    coordinates: trace.route
                      .filter(
                        (rp): rp is PcbTraceRoutePointWire =>
                          rp.route_type === "wire",
                      )
                      .map((rp) =>
                        applyToPoint(transformMmToSesUnit, {
                          x: rp.x,
                          y: rp.y,
                        }),
                      )
                      .flatMap((trp) => [trp.x, trp.y]),
                  },
                }
              }),
            }
          })
          .filter((net): net is { name: string; wires: Wire[] } =>
            Boolean(net),
          ),
      },
    },
  }

  return session
}
