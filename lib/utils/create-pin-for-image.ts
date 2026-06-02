import type { PcbSmtPad } from "circuit-json"

import type { PcbComponent, SourcePort } from "circuit-json"
import type { Pin } from "lib"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"

function getPolygonBbox(points: Array<{ x: number; y: number }>): {
  width: number
  height: number
  centerX: number
  centerY: number
} {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const pt of points) {
    if (pt.x < minX) minX = pt.x
    if (pt.x > maxX) maxX = pt.x
    if (pt.y < minY) minY = pt.y
    if (pt.y > maxY) maxY = pt.y
  }
  return {
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  }
}

export function createPinForImage(
  pad: any,
  pcbComponent: PcbComponent,
  sourcePort: SourcePort | undefined,
): Pin | undefined {
  if (!sourcePort) return undefined

  const isCircle = pad.shape === "circle"
  const isPolygon = pad.shape === "polygon"

  let widthUm: number | undefined
  let heightUm: number | undefined
  let padX: number
  let padY: number

  if (isCircle) {
    padX = pad.x
    padY = pad.y
  } else if (isPolygon) {
    const bbox = getPolygonBbox(pad.points)
    widthUm = bbox.width * 1000
    heightUm = bbox.height * 1000
    padX = bbox.centerX
    padY = bbox.centerY
  } else {
    widthUm = pad.width * 1000
    heightUm = pad.height * 1000
    padX = pad.x
    padY = pad.y
  }

  const padstackParams: PadstackNameArgs = {
    shape: isCircle ? "circle" : "rect",
    outerDiameter: isCircle ? pad.radius * 1000 * 2 : undefined,
    holeDiameter: isCircle ? pad.radius * 1000 * 2 : undefined,
    width: widthUm,
    height: heightUm,
    layer: pad.layer as PcbSmtPad["layer"],
  }

  return {
    padstack_name: getPadstackName(padstackParams),
    pin_number:
      sourcePort.port_hints?.find((hint) => !Number.isNaN(Number(hint))) || 1,
    x: (padX - pcbComponent.center.x) * 1000,
    y: (padY - pcbComponent.center.y) * 1000,
  }
}
