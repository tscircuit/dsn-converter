import type { SourceNet, SourcePort, SourceTrace } from "circuit-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

function normalizeDsnPinReference(pinReference: string) {
  return pinReference.replace(/"([^"]*)"/g, "$1")
}

export const convertNetsToSourceNetsAndTraces = ({
  dsnPcb,
  source_ports,
}: { dsnPcb: DsnPcb; source_ports: SourcePort[] }) => {
  const result: Array<SourceNet | SourceTrace> = []
  const { nets } = dsnPcb.network

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
      const connectedSourcePortIds = new Set<string>()
      for (const pin of pins) {
        const normalizedPin = normalizeDsnPinReference(pin)
        for (const source_port of source_ports) {
          if (source_port.name === pin || source_port.name === normalizedPin) {
            connectedSourcePortIds.add(source_port.source_port_id)
          }
        }
      }
      connected_source_port_ids.push(...connectedSourcePortIds)
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
