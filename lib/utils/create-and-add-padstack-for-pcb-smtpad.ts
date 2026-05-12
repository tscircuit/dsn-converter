import type { PcbSmtPad } from "circuit-json"
import type { Padstack } from "lib"
import type { DsnPcb } from "lib"
import {
  createCircularPadstack,
  createRectangularPadstack,
} from "./create-padstack"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"

export function createAndAddPadstackFromPcbSmtPad(
  pcb: DsnPcb,
  pad: PcbSmtPad,
  processedPadstacks: Set<string>,
  dsnUnitsPerMm = 1000,
): string {
  const isCircle = pad.shape === "circle"
  const padstackParams: PadstackNameArgs = {
    shape: isCircle ? "circle" : "rect",
    outerDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    holeDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    width: isCircle ? undefined : (pad as { width: number }).width * 1000,
    height: isCircle ? undefined : (pad as { height: number }).height * 1000,
    layer: pad.layer as PcbSmtPad["layer"],
  }
  const padstackDsnUnitParams: PadstackNameArgs = {
    shape: isCircle ? "circle" : "rect",
    outerDiameter: isCircle ? pad.radius * dsnUnitsPerMm * 2 : undefined,
    holeDiameter: isCircle ? pad.radius * dsnUnitsPerMm * 2 : undefined,
    width: isCircle
      ? undefined
      : (pad as { width: number }).width * dsnUnitsPerMm,
    height: isCircle
      ? undefined
      : (pad as { height: number }).height * dsnUnitsPerMm,
    layer: pad.layer as PcbSmtPad["layer"],
  }

  const padstackName = getPadstackName(padstackParams)

  if (!processedPadstacks.has(padstackName)) {
    const padstack: Padstack = isCircle
      ? createCircularPadstack(
          padstackName,
          padstackDsnUnitParams.outerDiameter!,
          padstackDsnUnitParams.holeDiameter!,
        )
      : createRectangularPadstack(
          padstackName,
          padstackDsnUnitParams.width!,
          padstackDsnUnitParams.height!,
          pad.layer,
        )

    pcb.library.padstacks.push(padstack)
    processedPadstacks.add(padstackName)
  }

  return padstackName
}
