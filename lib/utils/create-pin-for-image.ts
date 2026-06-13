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
  const padstackParams: PadstackNameArgs = {
    shape: isCircle ? "circle" : isPolygon ? "polygon" : "rect",
    outerDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    holeDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    width: isCircle
      ? undefined
      : isPolygon
        ? polygonData?.widthUm
        : pad.width * 1000,
    height: isCircle
      ? undefined
      : isPolygon
        ? polygonData?.heightUm
        : pad.height * 1000,
    layer: pad.layer as PcbSmtPad["layer"],
    customDescriptor: isPolygon
      ? `${polygonData?.widthUm}x${polygonData?.heightUm}_${polygonData?.relativePointsUm.join("_")}`
      : undefined,
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
