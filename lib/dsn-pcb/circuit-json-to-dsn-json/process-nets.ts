import type { DsnPcb } from "../types"
import type { AnyCircuitElement, SourcePort } from "circuit-json"

export function processNets(circuitElements: AnyCircuitElement[], pcb: DsnPcb) {
  const componentNameMap = new Map<string, string>()

  for (const element of circuitElements) {
    if (element.type === "source_component") {
      componentNameMap.set(element.source_component_id, element.name)
    }
  }

  const padsBySourcePortId = new Map()

  for (const element of circuitElements) {
    if (
      (element.type === "pcb_smtpad" || element.type === "pcb_plated_hole") &&
      element.pcb_port_id
    ) {
      const pcbPort = circuitElements.find(
        (e) => e.type === "pcb_port" && e.pcb_port_id === element.pcb_port_id,
      )

      if (pcbPort && "source_port_id" in pcbPort) {
        const sourcePort = circuitElements.find(
          (e) =>
            e.type === "source_port" &&
            e.source_port_id === pcbPort.source_port_id,
        ) as SourcePort

        if (sourcePort && "source_component_id" in sourcePort) {
          const componentName =
            componentNameMap.get(sourcePort.source_component_id) || ""
          const pinNumber = element.port_hints?.[0] || "1"

          padsBySourcePortId.set(sourcePort.source_port_id, {
            componentName,
            pinNumber,
            sourcePortId: sourcePort.source_port_id,
          })
        }
      }
    }
  }

  const netMap = new Map()

  for (const element of circuitElements) {
    if (element.type === "source_trace" && element.connected_source_port_ids) {
      const connectedPorts = element.connected_source_port_ids

      if (connectedPorts.length >= 2) {
        const firstPad = padsBySourcePortId.get(connectedPorts[0])

        if (firstPad) {
          const netName = `Net-(${firstPad.componentName}-Pad${firstPad.pinNumber})`

          if (!netMap.has(netName)) {
            netMap.set(netName, new Set())
          }

          for (const portId of connectedPorts) {
            const padInfo = padsBySourcePortId.get(portId)
            if (padInfo) {
              netMap
                .get(netName)
                ?.add(`${padInfo.componentName}-${padInfo.pinNumber}`)
            }
          }
        }
      }
    }
  }

  for (const [sourcePortId, padInfo] of padsBySourcePortId) {
    let isConnected = false
    for (const connectedPads of netMap.values()) {
      if (connectedPads.has(`${padInfo.componentName}-${padInfo.pinNumber}`)) {
        isConnected = true
        break
      }
    }

    if (!isConnected) {
      const unconnectedNetName = `unconnected-(${padInfo.componentName}-Pad${padInfo.pinNumber})`
      netMap.set(
        unconnectedNetName,
        new Set([`${padInfo.componentName}-${padInfo.pinNumber}`]),
      )
    }
  }

  // Sort nets with connected nets first
  const allNets = Array.from(netMap.keys()).sort((a, b) => {
    if (a.startsWith("Net-") && !b.startsWith("Net-")) return -1
    if (!a.startsWith("Net-") && b.startsWith("Net-")) return 1
    return a.localeCompare(b)
  })

  // Add nets in sorted order
  for (const netName of allNets) {
    pcb.network.nets.push({
      name: netName,
      pins: Array.from(netMap.get(netName) || []),
    })
  }

  // Update class net names
  pcb.network.classes[0].net_names = allNets
}
