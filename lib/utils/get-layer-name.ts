import type { DsnPcb, DsnSession } from "lib/dsn-pcb/types"

export function getLayerName(
  dsnLayerName: string,
  dsnPcb?: DsnPcb | DsnSession,
): string {
  if (!dsnPcb || !("structure" in dsnPcb) || !dsnPcb.structure?.layers) {
    if (
      dsnLayerName.toLowerCase().includes("top") ||
      dsnLayerName.includes("F.")
    )
      return "top"
    if (
      dsnLayerName.toLowerCase().includes("bottom") ||
      dsnLayerName.includes("B.")
    )
      return "bottom"
    return "top" // fallback
  }

  const layers = dsnPcb.structure.layers
  const layer = layers.find((l) => l.name === dsnLayerName)
  
  if (!layer) {
    if (dsnLayerName.toLowerCase().includes("top") || dsnLayerName.includes("F."))
      return "top"
    if (
      dsnLayerName.toLowerCase().includes("bottom") ||
      dsnLayerName.includes("B.")
    )
      return "bottom"
    return "top" // fallback
  }

  const layerIndex = layer.property.index
  const totalLayers = layers.length
  
  if (layerIndex === 0) return "top"
  if (layerIndex === totalLayers - 1) return "bottom"
  return `inner${layerIndex}`
}
