import type { PcbComponent, SourceComponentBase } from "circuit-json"

export function getFootprintName(
  sourceComponent: SourceComponentBase,
  pcbComponent: PcbComponent,
): string {
  if (!sourceComponent || !pcbComponent) {
    return ""
  }
  const width = pcbComponent.width == null ? 0 : pcbComponent.width.toFixed(4)
  const height =
    pcbComponent.height == null ? 0 : pcbComponent.height.toFixed(4)
  return `${sourceComponent.ftype}:${width}x${height}_mm`
}
