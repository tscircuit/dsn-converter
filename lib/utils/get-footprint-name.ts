import type { PcbComponent, SourceComponentBase } from "circuit-json"

export function getFootprintName(
  sourceComponent: SourceComponentBase | undefined,
  pcbComponent: PcbComponent | undefined,
): string {
  if (!pcbComponent) {
    return sourceComponent?.ftype || sourceComponent?.name || ""
  }
  const width = pcbComponent.width == null ? 0 : pcbComponent.width.toFixed(4)
  const height =
    pcbComponent.height == null ? 0 : pcbComponent.height.toFixed(4)
  const componentType =
    sourceComponent?.ftype ||
    sourceComponent?.name ||
    pcbComponent.pcb_component_id ||
    "unknown"
  return `${componentType}:${width}x${height}_mm`
}
