import type { LayerRef } from "circuit-json"

export function mapDsnLayerToCircuitLayer(layerName?: string): LayerRef {
  const normalized = layerName?.trim().toLowerCase()

  if (normalized === "top" || normalized === "front" || normalized === "f.cu") {
    return "top"
  }

  if (
    normalized === "bottom" ||
    normalized === "back" ||
    normalized === "b.cu"
  ) {
    return "bottom"
  }

  const innerLayerMatch = normalized?.match(/^in([1-9]\d*)\.cu$/)
  if (innerLayerMatch) {
    return `inner${innerLayerMatch[1]}` as LayerRef
  }

  return "top"
}
