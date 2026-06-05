import type { PcbSmtPad } from "circuit-json"

import type { PcbComponent, SourcePort } from "circuit-json"
import type { Pin } from "lib"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"

export function createPinForImage(
  pad: any,
  pcbComponent: PcbComponent,
  sourcePort: SourcePort | undefined,
): Pin | undefined {
  if (!sourcePort) return undefined

  const isCircle = pad.shape === "circle"
  const isPolygon = pad.shape === "polygon"

  let bboxWidth: number | undefined
  let bboxHeight: number | undefined
  if (isPolygon) {
    const points = (pad as any).points as { x: number; y: number }[]
    const xs = points.map((p: { x: number }) => p.x)
    const ys = points.map((p: { y: number }) => p.y)
    bboxWidth = (Math.max(...xs) - Math.min(...xs)) * 1000
    bboxHeight = (Math.max(...ys) - Math.min(...ys)) * 1000
  }

  const padstackParams: PadstackNameArgs = {
    shape: isCircle ? "circle" : "rect",
    outerDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    holeDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    width: isCircle ? undefined : isPolygon ? bboxWidth : pad.width * 1000,
    height: isCircle ? undefined : isPolygon ? bboxHeight : pad.height * 1000,
    layer: pad.layer as PcbSmtPad["layer"],
  }

  return {
    padstack_name: getPadstackName(padstackParams),
    pin_number:
      sourcePort.port_hints?.find((hint) => !Number.isNaN(Number(hint))) || 1,
    x: (pad.x - pcbComponent.center.x) * 1000,
    y: (pad.y - pcbComponent.center.y) * 1000,
  }
}
