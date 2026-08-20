import type { PcbSmtPad } from "circuit-json"
import type { PcbComponent, SourcePort } from "circuit-json"
import type { Pin } from "lib"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"
import { getPolygonSmtPadGeometry } from "./get-polygon-smt-pad-geometry"

export function createPinForImage({
  pad,
  pcbComponent,
  sourcePort,
  resolution = 1,
}: {
  pad: PcbSmtPad
  pcbComponent: PcbComponent
  sourcePort: SourcePort | undefined
  resolution?: number
}): Pin | undefined {
  if (!sourcePort) return undefined

  const isCircle = pad.shape === "circle"
  const isPolygon = pad.shape === "polygon"
  const polygonPadGeometry = isPolygon
    ? getPolygonSmtPadGeometry(pad)
    : undefined

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
    width = polygonPadGeometry?.widthUm
    height = polygonPadGeometry?.heightUm
    customDescriptor = `${polygonPadGeometry?.widthUm}x${polygonPadGeometry?.heightUm}_${polygonPadGeometry?.relativePointsUm.join("_")}`
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

  const padCenter = isPolygon
    ? polygonPadGeometry!.center
    : { x: pad.x, y: pad.y }

  const multiplier = 1000 * resolution

  // Apply rotation to the pad offset
  const rotationRad = (pcbComponent.rotation * Math.PI) / 180
  const cosR = Math.cos(rotationRad)
  const sinR = Math.sin(rotationRad)

  const dx = padCenter.x - pcbComponent.center.x
  const dy = padCenter.y - pcbComponent.center.y

  // Rotate the offset to match DSN's relative-to-component-center system
  const rotatedX = dx * cosR + dy * sinR
  const rotatedY = -dx * sinR + dy * cosR

  return {
    padstack_name: getPadstackName(padstackParams),
    pin_number:
      sourcePort.pin_number ||
      sourcePort.port_hints?.find((hint) => !Number.isNaN(Number(hint))) ||
      1,
    x: rotatedX * multiplier,
    y: rotatedY * multiplier,
  }
}
