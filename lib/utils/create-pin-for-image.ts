import type { PcbComponent, PcbSmtPad, SourcePort } from "circuit-json"
import type { Pin } from "lib"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"
import { getPolygonSmtPadGeometry } from "./get-polygon-smt-pad-geometry"

function resolvePinNumber(
  sourcePort: SourcePort | undefined,
  pad: PcbSmtPad,
  defaultPinNumber: number | string = 1,
): number | string {
  const numericSourceHint = sourcePort?.port_hints?.find(
    (hint) => !Number.isNaN(Number(hint)),
  )
  if (numericSourceHint !== undefined) {
    return numericSourceHint
  }

  if (
    sourcePort &&
    "pin_number" in sourcePort &&
    sourcePort.pin_number !== undefined &&
    !Number.isNaN(Number(sourcePort.pin_number))
  ) {
    return sourcePort.pin_number
  }

  const numericPadHint = pad.port_hints?.find(
    (hint) => !Number.isNaN(Number(hint)),
  )
  if (numericPadHint !== undefined) {
    return numericPadHint
  }

  const allHints = [
    ...(sourcePort?.port_hints ?? []),
    ...(pad.port_hints ?? []),
    ...(sourcePort?.name ? [sourcePort.name] : []),
  ]
  for (const hint of allHints) {
    const match = /^pin[_-]?(\d+)$/i.exec(hint.trim())
    if (match) {
      return Number(match[1])
    }
  }

  return defaultPinNumber
}

export function createPinForImage({
  pad,
  pcbComponent,
  sourcePort,
  defaultPinNumber = 1,
}: {
  pad: PcbSmtPad
  pcbComponent: PcbComponent | undefined
  sourcePort: SourcePort | undefined
  defaultPinNumber?: number | string
}): Pin | undefined {
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
  } else if ("width" in pad && "height" in pad) {
    width = pad.width * 1000
    height = pad.height * 1000
  } else {
    return undefined
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
  const componentCenter = pcbComponent?.center ?? { x: 0, y: 0 }

  return {
    padstack_name: getPadstackName(padstackParams),
    pin_number: resolvePinNumber(sourcePort, pad, defaultPinNumber),
    x: (padCenter.x - componentCenter.x) * 1000,
    y: (padCenter.y - componentCenter.y) * 1000,
  }
}
