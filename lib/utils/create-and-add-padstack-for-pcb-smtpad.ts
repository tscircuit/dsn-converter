import type { PcbSmtPad } from "circuit-json"
import type { Padstack } from "lib"
import type { DsnPcb } from "lib"
import {
  createCircularPadstack,
  createPolygonPadstack,
  createRectangularPadstack,
} from "./create-padstack"
import { getSmtPadGeometry } from "./get-smtpad-geometry"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"

export function createAndAddPadstackFromPcbSmtPad(
  pcb: DsnPcb,
  pad: PcbSmtPad,
  processedPadstacks: Set<string>,
): string {
  const geometry = getSmtPadGeometry(pad)
  const padstackParams: PadstackNameArgs = {
    shape: geometry.padstackShape,
    outerDiameter: geometry.outerDiameter,
    holeDiameter: geometry.holeDiameter,
    width: geometry.width,
    height: geometry.height,
    layer: geometry.layer,
  }

  const padstackName = getPadstackName(padstackParams)

  if (!processedPadstacks.has(padstackName)) {
    const padstack: Padstack =
      geometry.padstackShape === "circle"
        ? createCircularPadstack(
            padstackName,
            padstackParams.outerDiameter!,
            padstackParams.holeDiameter!,
          )
        : geometry.padstackShape === "polygon"
          ? createPolygonPadstack(
              padstackName,
              geometry.coordinates!,
              geometry.layer,
            )
          : createRectangularPadstack(
              padstackName,
              padstackParams.width!,
              padstackParams.height!,
              geometry.layer,
            )

    pcb.library.padstacks.push(padstack)
    processedPadstacks.add(padstackName)
  }

  return padstackName
}
