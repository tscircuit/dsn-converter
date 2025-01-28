import type { SourceNet, SourcePort, SourceTrace } from "circuit-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

export const convertNetsToSourceNetsAndTraces = ({
  dsnPcb,
  source_ports,
}: { dsnPcb: DsnPcb; source_ports: SourcePort[] }) => {
  const result: Array<SourceNet | SourceTrace> = []
  const { nets } = dsnPcb.network

  let source_trace_id = dsnPcb.wiring.wires.length
  for (const { name, pins } of nets) {
    if (name.startsWith("unconnected-")) continue
    const source_net: SourceNet = {
      type: "source_net",
      name,
      source_net_id: `source_net_${name}`,
      member_source_group_ids: [],
    }

    const connected_source_port_ids: string[] = []
    for (const pin of pins) {
      const source_port = source_ports.find((sp) => sp.name === pin)
      if (source_port)
        connected_source_port_ids.push(source_port.source_port_id)
    }

    const source_trace: SourceTrace = {
      type: "source_trace",
      connected_source_net_ids: [source_net.source_net_id],
      connected_source_port_ids,
      source_trace_id: `source_trace_${source_trace_id}`,
    }
    result.push(source_net, source_trace)
    source_trace_id++
  }

  return result
}
