import type { AnyCircuitElement, PcbTraceRoutePointWire } from "circuit-json"
import type { DsnSession, Wire } from "../types"
import { su } from "@tscircuit/soup-util"
import { applyToPoint, scale } from "transformation-matrix"

export function getDsnSessionFromCircuitJson(
  circuitJson: AnyCircuitElement[],
): DsnSession {
  const pcb_traces = su(circuitJson as any).pcb_trace.list()
  const source_traces = su(circuitJson as any).source_trace.list()
  const nets = su(circuitJson as any).source_net.list()

  // Only applies to the traces (components are not getting affected)
  const transformMmToSesUnit = scale(10000)

  const session: DsnSession = {
    is_dsn_session: true,
    filename: "session",
    placement: {
      resolution: { unit: "um", value: 10 },
      components: [],
    },
    routes: {
      resolution: { unit: "um", value: 10 },
      parser: {
        string_quote: "",
        host_version: "",
        space_in_quoted_tokens: "",
        host_cad: "",
      },
      library_out: {
        padstacks: [],
      },
      network_out: {
        nets: nets
          .map((net) => {
            const pcb_traces_for_net = pcb_traces.filter((pcb_trace) => {
              const source_trace = source_traces.find(
                (st) => st.source_trace_id === pcb_trace.source_trace_id,
              )
              return source_trace?.connected_source_net_ids.includes(
                net.source_net_id,
              )
            })

            if (pcb_traces_for_net.length === 0) return null

            return {
              name: net.name,
              wires: pcb_traces_for_net.flatMap((trace): Wire => {
                return {
                  path: {
                    layer: "F.Cu",
                    width: 0.1,
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
