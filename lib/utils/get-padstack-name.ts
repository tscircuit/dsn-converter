import type { PcbSmtPad } from "circuit-json"

interface PadstackNameArgs {
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
      return `Round[${layerCode}]Pad_${holeDiameter}_${outerDiameter}_um`
    case "oval":
      return `Oval[${layerCode}]Pad_${width}x${height}_um`
    case "pill":
      return `Oval[${layerCode}]Pad_${width}x${height}_um`
    case "rect":
      return `RoundRect[${layerCode}]Pad_${width}x${height}_um`
    default:
      return "default_pad"
  }
}
