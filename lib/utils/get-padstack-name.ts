import type { PcbSmtPad } from "circuit-json"

type PadstackLayer = "top" | "bottom" | "all"
type PadstackLayerCode = "T" | "B" | "A"

export interface PadstackNameArgs {
  shape: "circle" | "oval" | "pill" | "rect" | "polygon"
  width?: number
  height?: number
  holeDiameter?: number
  outerDiameter?: number
  layer?: PcbSmtPad["layer"] | "all"
  customDescriptor?: string
}

export type ParsedPadstackName =
  | {
      shape: "circle"
      layer: PadstackLayer
      holeDiameter: number
      outerDiameter: number
    }
  | {
      shape: "oval"
      layer: PadstackLayer
      width: number
      height: number
    }
  | {
      shape: "rect"
      layer: PadstackLayer
      width: number
      height: number
    }
  | {
      shape: "polygon"
      layer: PadstackLayer
      descriptor: string
    }

const padstackNamePrefixes = {
  circle: "Round[",
  oval: "Oval[",
  pill: "Oval[",
  rect: "RoundRect[",
  polygon: "Cust[",
} as const

const padstackLayerByCode: Record<PadstackLayerCode, PadstackLayer> = {
  T: "top",
  B: "bottom",
  A: "all",
}

const padstackLayerCodeByLayer: Record<PadstackLayer, PadstackLayerCode> = {
  top: "T",
  bottom: "B",
  all: "A",
}

function isPadstackLayerCode(
  layerCode: string,
): layerCode is PadstackLayerCode {
  return layerCode === "T" || layerCode === "B" || layerCode === "A"
}

function parsePadstackLayer(layerCode: string): PadstackLayer | null {
  if (!isPadstackLayerCode(layerCode)) return null
  return padstackLayerByCode[layerCode]
}

function parseMicrometers(micrometersText: string): number {
  return Number(micrometersText) / 1000
}

function getPadstackLayerCode(
  layer: PadstackNameArgs["layer"],
): PadstackLayerCode {
  if (layer === "bottom" || layer === "all") {
    return padstackLayerCodeByLayer[layer]
  }

  return padstackLayerCodeByLayer.top
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
  const layerCode = getPadstackLayerCode(layer)
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

export function parsePadstackName(
  padstackName: string,
): ParsedPadstackName | null {
  const circleMatch = padstackName.match(
    /^Round\[([TBA])\]Pad_([0-9]+(?:\.[0-9]+)?)_([0-9]+(?:\.[0-9]+)?)_um$/,
  )
  if (circleMatch) {
    const layer = parsePadstackLayer(circleMatch[1])
    if (!layer) return null

    return {
      shape: "circle",
      layer,
      holeDiameter: parseMicrometers(circleMatch[2]),
      outerDiameter: parseMicrometers(circleMatch[3]),
    }
  }

  const ovalMatch = padstackName.match(
    /^Oval\[([TBA])\]Pad_([0-9]+(?:\.[0-9]+)?)x([0-9]+(?:\.[0-9]+)?)_um$/,
  )
  if (ovalMatch) {
    const layer = parsePadstackLayer(ovalMatch[1])
    if (!layer) return null

    return {
      shape: "oval",
      layer,
      width: parseMicrometers(ovalMatch[2]),
      height: parseMicrometers(ovalMatch[3]),
    }
  }

  const rectMatch = padstackName.match(
    /^RoundRect\[([TBA])\]Pad_([0-9]+(?:\.[0-9]+)?)x([0-9]+(?:\.[0-9]+)?)_um$/,
  )
  if (rectMatch) {
    const layer = parsePadstackLayer(rectMatch[1])
    if (!layer) return null

    return {
      shape: "rect",
      layer,
      width: parseMicrometers(rectMatch[2]),
      height: parseMicrometers(rectMatch[3]),
    }
  }

  const polygonMatch = padstackName.match(/^Cust\[([TBA])\]Pad_(.+)_um$/)
  if (polygonMatch) {
    const layer = parsePadstackLayer(polygonMatch[1])
    if (!layer) return null

    return {
      shape: "polygon",
      layer,
      descriptor: polygonMatch[2],
    }
  }

  return null
}
