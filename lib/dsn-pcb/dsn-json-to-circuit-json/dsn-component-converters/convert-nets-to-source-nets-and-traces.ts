import type { SourceNet, SourcePort, SourceTrace } from "circuit-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

const normalizeDsnPinReference = (pinReference: string) =>
  pinReference.replace(/"([^"]*)"/g, "$1")

export const convertNetsToSourceNetsAndTraces = ({
  dsnPcb,
  source_ports,
}: { dsnPcb: DsnPcb; source_ports: SourcePort[] }) => {
  const result: Array<SourceNet | SourceTrace> = []
  const { nets } = dsnPcb.network
  const sourcePortByName = new Map(
    source_ports.map((sourcePort) => [sourcePort.name, sourcePort]),
  )

  let source_trace_id = dsnPcb.wiring.wires.length
  for (const net of nets) {
    const { name, pins = [] } = net

    if (!name || name.startsWith("unconnected-")) continue

    const source_net: SourceNet = {
      type: "source_net",
      name,
      source_net_id: `source_net_${name}`,
      member_source_group_ids: [],
    }

    const connected_source_port_ids: string[] = []
    if (pins && pins.length > 0) {
      for (const pin of pins) {
        const source_port = sourcePortByName.get(normalizeDsnPinReference(pin))
        if (source_port) {
          connected_source_port_ids.push(source_port.source_port_id)
        }
      }
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
