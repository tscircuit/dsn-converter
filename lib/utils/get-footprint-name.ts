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
  const rotation = (((pcbComponent.rotation ?? 0) % 360) + 360) % 360
  const rotationSuffix =
    rotation !== 0 && rotation !== 90 ? `_${rotation}deg` : ""
  return `${sourceComponent.ftype}:${width}x${height}_mm${rotationSuffix}`
}
