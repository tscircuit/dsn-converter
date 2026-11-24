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
  const normalizedRotation = (((pcbComponent.rotation ?? 0) % 360) + 360) % 360
  const rotationSuffix =
    Math.abs(normalizedRotation % 90) > 1e-6
      ? `:rot${Number(normalizedRotation.toFixed(4))}`
      : ""
  return `${sourceComponent.ftype}:${width}x${height}_mm${rotationSuffix}`
}
