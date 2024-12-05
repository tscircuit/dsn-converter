import type { PcbComponent, SourceComponentBase } from "circuit-json"

export function getFootprintName(
  sourceComponent: SourceComponentBase,
  pcbComponent: PcbComponent,
): string {
  const width = pcbComponent.width.toFixed(4)
  const height = pcbComponent.height.toFixed(4)
  return `${sourceComponent.ftype}:${width}x${height}`
}
