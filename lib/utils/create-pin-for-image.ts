import type { PcbSmtPad } from "circuit-json"

import type { PcbComponent, SourcePort } from "circuit-json"
import type { Pin } from "lib"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"

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

  // Pad positions in circuit JSON are in world coordinates (already rotated).
  // DSN image pins need local (unrotated) coordinates, so un-rotate by the
  // component's rotation angle.
  const relX = pad.x - pcbComponent.center.x
  const relY = pad.y - pcbComponent.center.y
  const rotation = pcbComponent.rotation ?? 0
  const rad = (-rotation * Math.PI) / 180
  const localX = relX * Math.cos(rad) - relY * Math.sin(rad)
  const localY = relX * Math.sin(rad) + relY * Math.cos(rad)

  return {
    padstack_name: getPadstackName(padstackParams),
    pin_number:
      sourcePort.port_hints?.find((hint) => !Number.isNaN(Number(hint))) || 1,
    x: localX * 1000,
    y: localY * 1000,
  }
}
