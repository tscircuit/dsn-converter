import type { PcbSmtPad } from "circuit-json"

import type { PcbComponent, SourcePort } from "circuit-json"
import type { Pin } from "lib"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"
import { getPolygonSmtPadData } from "./get-polygon-smt-pad-data"

export function createPinForImage(
  pad: PcbSmtPad,
  pcbComponent: PcbComponent,
  sourcePort: SourcePort | undefined,
): Pin | undefined {
  if (!sourcePort) return undefined

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
    width = pad.width * 1000
    height = pad.height * 1000
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
  const padCenter = isPolygon ? polygonData!.center : { x: pad.x, y: pad.y }

  return {
    padstack_name: getPadstackName(padstackParams),
    pin_number:
      sourcePort.port_hints?.find((hint) => !Number.isNaN(Number(hint))) || 1,
    x: (padCenter.x - pcbComponent.center.x) * 1000,
    y: (padCenter.y - pcbComponent.center.y) * 1000,
  }
}
