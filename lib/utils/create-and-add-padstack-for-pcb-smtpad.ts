import type { PcbSmtPad } from "circuit-json"
import type { Padstack } from "lib"
import type { DsnPcb } from "lib"
import {
  createCircularPadstack,
  createOvalSmtPadstack,
  createRectangularPadstack,
} from "./create-padstack"
import { type PadstackNameArgs, getPadstackName } from "./get-padstack-name"

export function createAndAddPadstackFromPcbSmtPad(
  pcb: DsnPcb,
  pad: PcbSmtPad,
  processedPadstacks: Set<string>,
): string {
  const isCircle = pad.shape === "circle"
  const isPill = pad.shape === "pill"
  const sizedPad = pad as PcbSmtPad & { width: number; height: number }
  const padstackParams: PadstackNameArgs = {
    shape: isCircle ? "circle" : isPill ? "pill" : "rect",
    outerDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    holeDiameter: isCircle ? pad.radius * 1000 * 2 : undefined, // Radius to diameter
    width: isCircle ? undefined : sizedPad.width * 1000,
    height: isCircle ? undefined : sizedPad.height * 1000,
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
      : isPill
        ? createOvalSmtPadstack(
            padstackName,
            padstackParams.width!,
            padstackParams.height!,
            pad.layer,
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
