import type {
  AnyCircuitElement,
  SourceComponentBase,
  SourcePort,
} from "circuit-json"

interface SourcePortInfo {
  displayName: string
}

export function getCombinedSourcePortName(
  circuitElements: AnyCircuitElement[],
  connectedSourcePortIds: string[],
): string {
  const portInfos: SourcePortInfo[] = []

  for (const portId of connectedSourcePortIds) {
    // Find the source port
    const sourcePort = circuitElements.find(
      (el) => el.type === "source_port" && el.source_port_id === portId,
    ) as SourcePort | undefined

    if (!sourcePort) continue

    // Find the associated component
    const sourceComponent = circuitElements.find(
      (el) =>
        el.type === "source_component" &&
        el.source_component_id === sourcePort.source_component_id,
    ) as SourceComponentBase

    if (!sourceComponent) continue

    // Construct display name combining component name and port name
    const componentName =
      sourceComponent.name || sourceComponent.source_component_id
    const portName =
      sourcePort.name || sourcePort.pin_number?.toString() || portId

    portInfos.push({
      displayName: `Pad${portName.replace("pin", "")}_${componentName}_${sourcePort.source_component_id}`,
    })
  }

  return portInfos.map((p) => p.displayName).join("--")
}
