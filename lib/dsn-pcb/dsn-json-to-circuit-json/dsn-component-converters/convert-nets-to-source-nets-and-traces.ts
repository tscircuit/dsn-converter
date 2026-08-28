import type { SourceNet, SourcePort, SourceTrace } from "circuit-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

const getSourcePortIdFromWirePortToken = (
  token: string,
  source_ports: SourcePort[],
) =>
  source_ports.find((sp) => sp.source_port_id.includes(token))?.source_port_id

const getRoutedPortSets = (dsnPcb: DsnPcb, source_ports: SourcePort[]) => {
  return dsnPcb.wiring.wires
    .map((wire) => {
      if (!wire.net?.includes("--")) return []

      return wire.net
        .split("--")
        .slice(1)
        .map((token) => getSourcePortIdFromWirePortToken(token, source_ports))
        .filter((source_port_id): source_port_id is string =>
          Boolean(source_port_id),
        )
    })
    .filter((source_port_ids) => source_port_ids.length >= 2)
}

const getNetAnchorSourcePortId = (
  netName: string,
  source_ports: SourcePort[],
) => {
  const match = /^Net-\((.+)-Pad(.+)\)$/.exec(netName)
  if (!match) return undefined

  const [, componentName, pinNumber] = match
  return source_ports.find(
    (sp) =>
      sp.name === `${componentName}-${pinNumber}` ||
      sp.name === `${componentName}-pin${pinNumber}` ||
      sp.source_port_id.includes(`Pad${pinNumber}_${componentName}`),
  )?.source_port_id
}

const trimRoutedSiblingPortsFromNetTrace = ({
  connected_source_port_ids,
  netName,
  routedPortSets,
  source_ports,
}: {
  connected_source_port_ids: string[]
  netName: string
  routedPortSets: string[][]
  source_ports: SourcePort[]
}) => {
  const anchorSourcePortId = getNetAnchorSourcePortId(netName, source_ports)
  if (!anchorSourcePortId) return connected_source_port_ids

  // The DSN net is the electrical union, but routed wire net names still carry
  // source_trace boundaries. Drop routed-only siblings when reconstructing a
  // net-derived source_trace; the caller skips it if only the anchor remains.
  const routedSiblingPortIds = new Set<string>()
  for (const routedPortSet of routedPortSets) {
    if (!routedPortSet.includes(anchorSourcePortId)) continue

    for (const sourcePortId of routedPortSet) {
      if (sourcePortId !== anchorSourcePortId) {
        routedSiblingPortIds.add(sourcePortId)
      }
    }
  }

  if (routedSiblingPortIds.size === 0) return connected_source_port_ids

  const trimmed_source_port_ids = connected_source_port_ids.filter(
    (sourcePortId) =>
      sourcePortId === anchorSourcePortId ||
      !routedSiblingPortIds.has(sourcePortId),
  )

  return trimmed_source_port_ids
}

export const convertNetsToSourceNetsAndTraces = ({
  dsnPcb,
  source_ports,
}: { dsnPcb: DsnPcb; source_ports: SourcePort[] }) => {
  const result: Array<SourceNet | SourceTrace> = []
  const { nets } = dsnPcb.network
  const routedPortSets = getRoutedPortSets(dsnPcb, source_ports)

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
        const source_port = source_ports.find((sp) => sp.name === pin)
        if (source_port) {
          connected_source_port_ids.push(source_port.source_port_id)
        }
      }
    }
    const net_connected_source_port_ids = trimRoutedSiblingPortsFromNetTrace({
      connected_source_port_ids,
      netName: name,
      routedPortSets,
      source_ports,
    })

    const source_trace: SourceTrace = {
      type: "source_trace",
      connected_source_net_ids: [source_net.source_net_id],
      connected_source_port_ids: net_connected_source_port_ids,
      source_trace_id: `source_trace_${source_trace_id}`,
    }
    result.push(source_net)
    if (net_connected_source_port_ids.length >= 2) {
      result.push(source_trace)
    }
    source_trace_id++
  }

  return result
}
