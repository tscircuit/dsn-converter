import type { AnyCircuitElement, PcbTraceRoutePointWire } from "circuit-json"
import type { DsnPcb, DsnSession, Wire } from "../types"
import { su } from "@tscircuit/soup-util"
import { convertCircuitJsonToDsnJson } from "./convert-circuit-json-to-dsn-json"
import { applyToPoint, scale } from "transformation-matrix"

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
        padstacks: [],
      },
      network_out: {
        nets: pcb_traces.map((trace) => {
          const source_trace = source_traces.find(
            (st) => st.source_trace_id === trace.source_trace_id,
          )
          const source_net =
            source_trace &&
            nets.find((n) =>
              source_trace.connected_source_net_ids.includes(n.source_net_id),
            )
          const net_name = source_net?.name || trace.source_trace_id

          // TODO only supports single layer traces
          const traceLayer =
            "layer" in trace.route[0] && trace.route[0].layer === "bottom"
              ? "bottom"
              : "top"

          const traceWidth =
            "width" in trace.route[0] ? trace.route[0].width : 0.16

          return {
            name: net_name!,
            wires: [
              {
                path: {
                  layer: traceLayer === "bottom" ? "B.Cu" : "F.Cu",
                  width: traceWidth * 1000,
                  coordinates: trace.route
                    .filter(
                      (rp): rp is PcbTraceRoutePointWire =>
                        rp.route_type === "wire",
                    )
                    .map((rp) =>
                      // Circuit JSON space to the SES space
                      applyToPoint(transformMmToSesUnit, {
                        x: rp.x,
                        y: rp.y,
                      }),
                    )
                    .flatMap((trp) => [trp.x, trp.y]),
                },
              },
            ],
          }
        }),
      },
    },
  }

  return session
}
