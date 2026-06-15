import type { PcbSmtPad } from "circuit-json"

export interface PadstackNameArgs {
  shape: "circle" | "oval" | "pill" | "rect" | "polygon"
  width?: number
  height?: number
  holeDiameter?: number
  outerDiameter?: number
  layer?: PcbSmtPad["layer"] | "all"
  customDescriptor?: string
}

export function getPadstackName({
  shape,
  width,
  height,
  holeDiameter,
  outerDiameter,
  layer = "top",
  customDescriptor,
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
      if (holeDiameter !== undefined) {
        return `RoundRect[${layerCode}]Pad_${width}x${height}_${holeDiameter}_um`
      }
      return `RoundRect[${layerCode}]Pad_${width}x${height}_um`
    case "polygon":
      return `Cust[${layerCode}]Pad_${customDescriptor ?? `${width}x${height}`}_um`
    default:
      return "default_pad"
  }
}
