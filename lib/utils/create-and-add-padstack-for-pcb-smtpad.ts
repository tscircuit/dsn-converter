import type { PcbSmtPad } from "circuit-json"
import type { Padstack } from "lib"
import type { DsnPcb } from "lib"
import {
  createCircularPadstack,
  createPolygonPadstack,
  createRectangularPadstack,
} from "./create-padstack"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"
import { getPolygonSmtPadData } from "./get-polygon-smt-pad-data"

export function createAndAddPadstackFromPcbSmtPad(
  pcb: DsnPcb,
  pad: PcbSmtPad,
  processedPadstacks: Set<string>,
): string {
  const isCircle = pad.shape === "circle"
  const isPolygon = pad.shape === "polygon"
  const polygonData = isPolygon ? getPolygonSmtPadData(pad) : undefined

  let shape: PadstackNameArgs["shape"] = "rect"
  let outerDiameter: number | undefined
  let holeDiameter: number | undefined
  let width: number | undefined
  let height: number | undefined
  let customDescriptor: string | undefined

  if (isCircle) {
    shape = "circle"
    outerDiameter = pad.radius * 1000 * 2 // Radius to diameter
    holeDiameter = pad.radius * 1000 * 2 // Radius to diameter
  } else if (isPolygon) {
    shape = "polygon"
    width = polygonData?.widthUm
    height = polygonData?.heightUm
    customDescriptor = `${polygonData?.widthUm}x${polygonData?.heightUm}_${polygonData?.relativePointsUm.join("_")}`
  } else {
    width = (pad as { width: number }).width * 1000
    height = (pad as { height: number }).height * 1000
  }

  const padstackParams: PadstackNameArgs = {
    shape,
    outerDiameter,
    holeDiameter,
    width,
    height,
    layer: pad.layer as PcbSmtPad["layer"],
    customDescriptor,
  }

  const padstackName = getPadstackName(padstackParams)

  if (!processedPadstacks.has(padstackName)) {
    let padstack: Padstack

    if (isCircle) {
      padstack = createCircularPadstack(
        padstackName,
        padstackParams.outerDiameter!,
        padstackParams.holeDiameter!,
      )
    } else if (isPolygon) {
      padstack = createPolygonPadstack(
        padstackName,
        polygonData!.relativePointsUm,
        pad.layer,
      )
    } else {
      padstack = createRectangularPadstack(
        padstackName,
        padstackParams.width!,
        padstackParams.height!,
        pad.layer,
      )
    }

    pcb.library.padstacks.push(padstack)
    processedPadstacks.add(padstackName)
  }

  return padstackName
}
