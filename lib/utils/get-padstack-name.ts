import type { PcbSmtPad } from "circuit-json"

export interface PadstackNameArgs {
  shape: "circle" | "oval" | "pill" | "rect"
  width?: number
  height?: number
  holeDiameter?: number
  outerDiameter?: number
  layer?: PcbSmtPad["layer"] | "all"
}

export function getPadstackName({
  shape,
  width,
  height,
  holeDiameter,
  outerDiameter,
  layer = "top",
}: PadstackNameArgs): string {
  const layerCode =
    {
      top: "T",
      bottom: "B",
      all: "A",
    }[layer as string] ?? "T"
  switch (shape) {
    case "circle":
      return `Round[${layerCode}]Pad_${Math.round(holeDiameter!)}_${Math.round(outerDiameter!)}_um`
    case "oval":
    case "pill":
      return `Oval[${layerCode}]Pad_${Math.round(width!)}x${Math.round(height!)}_um`
    case "rect":
      return `RoundRect[${layerCode}]Pad_${Math.round(width!)}x${Math.round(height!)}_um`
    default:
      return "default_pad"
  }
}
