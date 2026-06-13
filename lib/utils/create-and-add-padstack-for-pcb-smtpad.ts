import type { PcbSmtPad } from "circuit-json"
import type { Padstack } from "lib"
import type { DsnPcb } from "lib"
import {
  createCircularPadstack,
  createRectangularPadstack,
} from "./create-padstack"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"

export function createAndAddPadstackFromPcbSmtPad(
  pcb: DsnPcb,
  pad: PcbSmtPad,
  processedPadstacks: Set<string>,
): string {
  const isCircle = pad.shape === "circle"
  const isPolygon = pad.shape === "polygon"

  let bboxWidth: number | undefined
  let bboxHeight: number | undefined
  if (isPolygon) {
    const points = (pad as any).points as { x: number; y: number }[]
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    bboxWidth = (Math.max(...xs) - Math.min(...xs)) * 1000
    bboxHeight = (Math.max(...ys) - Math.min(...ys)) * 1000
  }

  const padstackParams: PadstackNameArgs = {
    shape: isCircle ? "circle" : "rect",
    outerDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    holeDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    width: isCircle ? undefined : isPolygon ? bboxWidth : (pad as { width: number }).width * 1000,
    height: isCircle ? undefined : isPolygon ? bboxHeight : (pad as { height: number }).height * 1000,
    layer: pad.layer as PcbSmtPad["layer"],
  }

  const padstackName = getPadstackName(padstackParams)

  if (!processedPadstacks.has(padstackName)) {
    const padstack: Padstack = isCircle
      ? createCircularPadstack(
          padstackName,
          padstackParams.outerDiameter!,
          padstackParams.holeDiameter!,
        )
      : createRectangularPadstack(
          padstackName,
          padstackParams.width!,
          padstackParams.height!,
          pad.layer,
        )

    pcb.library.padstacks.push(padstack)
    processedPadstacks.add(padstackName)
  }

  return padstackName
}
