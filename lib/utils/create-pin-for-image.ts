import type { PcbSmtPad } from "circuit-json"

import type { PcbComponent, SourcePort } from "circuit-json"
import type { Pin } from "lib"
import { getPadstackName, type PadstackNameArgs } from "./get-padstack-name"

export function createPinForImage(
  pad: any,
  pcbComponent: PcbComponent,
  sourcePort: SourcePort | undefined,
): Pin | undefined {
  if (!sourcePort) return undefined

  const isCircle = pad.shape === "circle"
  const padstackParams: PadstackNameArgs = {
    shape: isCircle ? "circle" : "rect",
    outerDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    holeDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    width: isCircle ? undefined : pad.width * 1000,
    height: isCircle ? undefined : pad.height * 1000,
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
