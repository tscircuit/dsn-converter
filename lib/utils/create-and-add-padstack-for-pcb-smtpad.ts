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
  let padstackParams: PadstackNameArgs

  if (pad.shape === "circle") {
    padstackParams = {
      shape: "circle",
      outerDiameter: pad.radius * 1000 * 2, // Radius to diameter
      holeDiameter: pad.radius * 1000 * 2, // Radius to diameter
      layer: pad.layer as PcbSmtPad["layer"],
    }
  } else {
    // For rect, rotated_rect, pill shapes that have width/height
    padstackParams = {
      shape: "rect",
      width: "width" in pad ? pad.width * 1000 : 1000, // Default 1mm if no width
      height: "height" in pad ? pad.height * 1000 : 1000, // Default 1mm if no height
      layer: pad.layer as PcbSmtPad["layer"],
    }
  }

  const padstackName = getPadstackName(padstackParams)

  if (!processedPadstacks.has(padstackName)) {
    const padstack: Padstack =
      pad.shape === "circle"
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
