import type { PcbSmtPad } from "circuit-json"

import type { PcbComponent, SourcePort } from "circuit-json"
import type { Pin } from "lib"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"

export function createPinForImage(
  pad: any,
  pcbComponent: PcbComponent,
  sourcePort: SourcePort | undefined,
  scalingFactor: number = 10000,
): Pin | undefined {
  if (!sourcePort) return undefined

  const isCircle = pad.shape === "circle"
  const padstackParams: PadstackNameArgs = {
    shape: isCircle ? "circle" : "rect",
    outerDiameter: isCircle ? pad.radius * scalingFactor * 2 : undefined, // Radius to diameter
    holeDiameter: isCircle ? pad.radius * scalingFactor * 2 : undefined, // Radius to diameter
    width: isCircle ? undefined : pad.width * scalingFactor,
    height: isCircle ? undefined : pad.height * scalingFactor,
    layer: pad.layer as PcbSmtPad["layer"],
  }

  return {
    padstack_name: getPadstackName(padstackParams),
    pin_number:
      sourcePort.port_hints?.find((hint) => !Number.isNaN(Number(hint))) || 1,
    x: (pad.x - pcbComponent.center.x) * scalingFactor,
    y: (pad.y - pcbComponent.center.y) * scalingFactor,
  }
}
