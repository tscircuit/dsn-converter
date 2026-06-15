import type { PcbRenderLayer } from "circuit-json"

export const getLayerFromDsnLayer = (dsnLayer: string): PcbRenderLayer => {
  const layer = dsnLayer.toLowerCase()
  if (layer.includes("top") || layer.includes("f.cu")) {
    return "top"
  }
  if (layer.includes("bottom") || layer.includes("b.cu")) {
    return "bottom"
  }
  
  const innerMatch = layer.match(/(?:in|route|inner)(\d+)/)
  if (innerMatch) {
    return `inner${innerMatch[1]}` as PcbRenderLayer
  }

  return "top"
}
