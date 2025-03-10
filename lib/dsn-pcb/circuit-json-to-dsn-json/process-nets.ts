import { su } from "@tscircuit/soup-util"
import type { AnyCircuitElement, SourceTrace } from "circuit-json"
import type { DsnPcb } from "../types"

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
      const pcbPort = su(circuitElements)
        .pcb_port.list()
        .find((e) => e.pcb_port_id === element.pcb_port_id)

      if (pcbPort && "source_port_id" in pcbPort) {
        const sourcePort = su(circuitElements)
          .source_port.list()
          .find((e) => e.source_port_id === pcbPort.source_port_id)

        if (sourcePort && "source_component_id" in sourcePort) {
          const componentName =
            componentNameMap.get(sourcePort.source_component_id) || ""
          const pinNumber = sourcePort.port_hints?.find(
            (hint) => !Number.isNaN(Number(hint)),
          )

          padsBySourcePortId.set(sourcePort.source_port_id, {
            componentName: `${componentName}_${sourcePort.source_component_id}`,
            pinNumber,
            sourcePortId: sourcePort.source_port_id,
          })
        }
      }
    }
  }

  const netMap = new Map()
  const netTraceWidthMap = new Map<string, number>()

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

          // Store trace width if specified
          if ("min_trace_thickness" in element && element.min_trace_thickness) {
            // Convert from mm to μm
            const traceWidthMicrons = element.min_trace_thickness * 1000
            netTraceWidthMap.set(netName, traceWidthMicrons)
          }
        }
      }
    }
  }

  // Only add unconnected nets for pads that aren't part of any existing net
  for (const [sourcePortId, padInfo] of padsBySourcePortId) {
    let isConnected = false
    const padIdentifier = `${padInfo.componentName}-${padInfo.pinNumber.replace("pin", "")}`
    for (const [_, connectedPads] of netMap.entries()) {
      if (
        Array.from(connectedPads).some(
          (pad: unknown) =>
            pad?.toString() === padIdentifier ||
            pad?.toString() === `${padInfo.componentName}-${padInfo.pinNumber}`,
        )
      ) {
        isConnected = true
        break
      }
    }

    // Check if the pad is connected to any source net (GND, VCC)
    let isInSourceNet = false
    for (const element of circuitElements) {
      if (element.type === "source_net") {
        const connectedTraces = circuitElements.filter(
          (e) =>
            e.type === "source_trace" &&
            e.connected_source_net_ids?.includes(element.source_net_id) &&
            e.connected_source_port_ids?.includes(sourcePortId),
        )
        if (connectedTraces.length > 0) {
          isInSourceNet = true

          // Store trace width if specified in any of the connected traces
          for (const trace of connectedTraces) {
            if ("min_trace_thickness" in trace && trace.min_trace_thickness) {
              const traceWidthMicrons = trace.min_trace_thickness * 1000
              netTraceWidthMap.set(
                `${element.name}_${element.source_net_id}`,
                traceWidthMicrons,
              )
              break
            }
          }

          break
        }
      }
    }

    if (!isConnected && !isInSourceNet) {
      const unconnectedNetName = `unconnected-(${padInfo.componentName}-Pad${padInfo.pinNumber.replace("pin", "")})`
      netMap.set(
        unconnectedNetName,
        new Set([`${padInfo.componentName}-${padInfo.pinNumber}`]),
      )
    }
  }

  // Add source nets (GND, VCC, etc.)
  for (const element of circuitElements) {
    if (element.type === "source_net") {
      const netName = `${element.name}_${element.source_net_id}`
      if (!netMap.has(netName)) {
        netMap.set(netName, new Set())
      }
      // Find all traces connected to this net
      const connectedTraces = circuitElements.filter(
        (e) =>
          e.type === "source_trace" &&
          e.connected_source_net_ids?.includes(element.source_net_id),
      ) as SourceTrace[]

      // Add connected ports to the net
      for (const trace of connectedTraces) {
        for (const portId of trace.connected_source_port_ids || []) {
          const padInfo = padsBySourcePortId.get(portId)
          if (padInfo) {
            netMap
              .get(netName)
              ?.add(`${padInfo.componentName}-${padInfo.pinNumber}`)
          }
        }

        // Store trace width if specified
        if (
          "min_trace_thickness" in trace &&
          trace.min_trace_thickness &&
          !netTraceWidthMap.has(netName)
        ) {
          const traceWidthMicrons = trace.min_trace_thickness * 1000
          netTraceWidthMap.set(netName, traceWidthMicrons)
        }
      }
    }
  }

  // Sort nets with source nets first, then connected nets, then unconnected
  const allNets = Array.from(netMap.keys()).sort((a, b) => {
    if (a === "GND") return -1
    if (b === "GND") return 1
    if (a === "VCC") return -1
    if (b === "VCC") return 1
    if (a.startsWith("Net-") && !b.startsWith("Net-")) return -1
    if (!a.startsWith("Net-") && b.startsWith("Net-")) return 1
    return a.localeCompare(b)
  })

  // Create a map of unique trace widths to class names
  const traceWidthClassMap = new Map<number, string>()
  const defaultTraceWidth = 200 // Default width in μm

  // Always include the default class
  traceWidthClassMap.set(defaultTraceWidth, "kicad_default")

  // Create additional classes for each unique trace width
  for (const [netName, traceWidth] of netTraceWidthMap.entries()) {
    if (
      traceWidth !== defaultTraceWidth &&
      !traceWidthClassMap.has(traceWidth)
    ) {
      const className = `trace_width_${traceWidth}um`
      traceWidthClassMap.set(traceWidth, className)

      // Add the new class to pcb.network.classes
      pcb.network.classes.push({
        name: className,
        description: `Trace width ${traceWidth}μm`,
        net_names: [],
        circuit: {
          use_via: "Via[0-1]_600:300_um",
        },
        rule: {
          clearances: [
            {
              value: 200,
              type: "",
            },
          ],
          width: traceWidth,
        },
      })
    }
  }

  // Group nets by trace width class
  const netsByClass = new Map<string, string[]>()

  for (const netName of allNets) {
    const traceWidth = netTraceWidthMap.get(netName) || defaultTraceWidth
    const className = traceWidthClassMap.get(traceWidth) || "kicad_default"

    if (!netsByClass.has(className)) {
      netsByClass.set(className, [])
    }

    netsByClass.get(className)?.push(netName)

    // Add net to pcb.network.nets
    pcb.network.nets.push({
      name: netName,
      pins: Array.from(netMap.get(netName) || []).map((pin) =>
        (pin as string).replace("pin", ""),
      ),
    })
  }

  // Update class net names
  for (const [className, nets] of netsByClass.entries()) {
    const classIndex = pcb.network.classes.findIndex(
      (c) => c.name === className,
    )
    if (classIndex !== -1) {
      pcb.network.classes[classIndex].net_names = nets
    }
  }

  // If a class has no nets, assign it the default net names
  for (const classObj of pcb.network.classes) {
    if (classObj.net_names.length === 0) {
      classObj.net_names = allNets
    }
  }
}
