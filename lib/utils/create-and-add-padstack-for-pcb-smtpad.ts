import type { PcbSmtPad } from "circuit-json"
import type { Padstack } from "lib"
import type { DsnPcb } from "lib"
import {
  createCircularPadstack,
  createRectangularPadstack,
} from "./create-padstack"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"

function getPolygonBoundingBox(points: Array<{ x: number; y: number }>): {
  width: number
  height: number
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
  return { width: maxX - minX, height: maxY - minY }
}

export function createAndAddPadstackFromPcbSmtPad(
  pcb: DsnPcb,
  pad: PcbSmtPad,
  processedPadstacks: Set<string>,
): string {
  const isCircle = pad.shape === "circle"

  let widthUm: number | undefined
  let heightUm: number | undefined

  if (!isCircle) {
    if (pad.shape === "polygon") {
      const bbox = getPolygonBoundingBox(pad.points)
      widthUm = bbox.width * 1000
      heightUm = bbox.height * 1000
    } else {
      widthUm = (pad as { width: number }).width * 1000
      heightUm = (pad as { height: number }).height * 1000
    }
  }

  const padstackParams: PadstackNameArgs = {
    shape: isCircle ? "circle" : "rect",
    outerDiameter: isCircle ? pad.radius * 1000 * 2 : undefined,
    holeDiameter: isCircle ? pad.radius * 1000 * 2 : undefined,
    width: widthUm,
    height: heightUm,
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
