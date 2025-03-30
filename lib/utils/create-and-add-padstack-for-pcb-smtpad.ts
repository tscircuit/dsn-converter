import type { Padstack } from "lib"
import type { PcbSmtPad } from "circuit-json"
import { getPadstackName, type PadstackNameArgs } from "./get-padstack-name"
import type { DsnPcb } from "lib"
import {
  createCircularPadstack,
  createRectangularPadstack,
} from "./create-padstack"

export function createAndAddPadstackFromPcbSmtPad(
  pcb: DsnPcb,
  pad: PcbSmtPad,
  processedPadstacks: Set<string>,
): string {
  const isCircle = pad.shape === "circle"
  const padstackParams: PadstackNameArgs = {
    shape: isCircle ? "circle" : "rect",
    outerDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    holeDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    width: isCircle ? undefined : pad.width * 1000,
    height: isCircle ? undefined : pad.height * 1000,
    layer: pad.layer as PcbSmtPad["layer"],
  }

  const padstackName = getPadstackName(padstackParams)

  if (!processedPadstacks.has(padstackName)) {
    const padstack: Padstack = isCircle
      ? createCircularPadstack(
          padstackName,
          padstackParams.outerDiameter!,
          padstackParams.holeDiameter!,
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
