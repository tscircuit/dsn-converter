import type { PcbSmtPad } from "circuit-json"

import type { PcbComponent, SourcePort } from "circuit-json"
import type { Pin } from "lib"
import { getSmtPadGeometry } from "./get-smtpad-geometry"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"

export function createPinForImage(
  pad: PcbSmtPad,
  pcbComponent: PcbComponent,
  sourcePort: SourcePort | undefined,
): Pin | undefined {
  if (!sourcePort) return undefined

  const geometry = getSmtPadGeometry(pad)
  const padstackParams: PadstackNameArgs = {
    shape: geometry.padstackShape,
    outerDiameter: geometry.outerDiameter,
    holeDiameter: geometry.holeDiameter,
    width: geometry.width,
    height: geometry.height,
    layer: geometry.layer,
  }

  return {
    padstack_name: getPadstackName(padstackParams),
    pin_number:
      sourcePort.port_hints?.find((hint) => !Number.isNaN(Number(hint))) || 1,
    x: (geometry.anchor.x - pcbComponent.center.x) * 1000,
    y: (geometry.anchor.y - pcbComponent.center.y) * 1000,
  }
}
