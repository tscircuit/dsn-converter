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

const padstackNamePrefixes = {
  circle: "Round[",
  oval: "Oval[",
  pill: "Oval[",
  rect: "RoundRect[",
  polygon: "Cust[",
} as const

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
      return `${padstackNamePrefixes.circle}${layerCode}]Pad_${holeDiameter}_${outerDiameter}_um`
    case "oval":
      return `${padstackNamePrefixes.oval}${layerCode}]Pad_${width}x${height}_um`
    case "pill":
      return `${padstackNamePrefixes.pill}${layerCode}]Pad_${width}x${height}_um`
    case "rect":
      return `${padstackNamePrefixes.rect}${layerCode}]Pad_${width}x${height}_um`
    case "polygon":
      return `${padstackNamePrefixes.polygon}${layerCode}]Pad_${customDescriptor ?? `${width}x${height}`}_um`
    default:
      return "default_pad"
  }
}
