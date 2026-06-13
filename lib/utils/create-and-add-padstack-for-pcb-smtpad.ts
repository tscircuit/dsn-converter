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
  const padstackParams: PadstackNameArgs = {
    shape: isCircle ? "circle" : isPolygon ? "polygon" : "rect",
    outerDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    holeDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    width: isCircle
      ? undefined
      : isPolygon
        ? polygonData?.widthUm
        : (pad as { width: number }).width * 1000,
    height: isCircle
      ? undefined
      : isPolygon
        ? polygonData?.heightUm
        : (pad as { height: number }).height * 1000,
    layer: pad.layer as PcbSmtPad["layer"],
    customDescriptor: isPolygon
      ? `${polygonData?.widthUm}x${polygonData?.heightUm}_${polygonData?.relativePointsUm.join("_")}`
      : undefined,
  }

  const padstackName = getPadstackName(padstackParams)

  if (!processedPadstacks.has(padstackName)) {
    const padstack: Padstack = isCircle
      ? createCircularPadstack(
          padstackName,
          padstackParams.outerDiameter!,
          padstackParams.holeDiameter!,
        )
      : isPolygon
        ? createPolygonPadstack(
            padstackName,
            polygonData!.relativePointsUm,
            pad.layer,
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
