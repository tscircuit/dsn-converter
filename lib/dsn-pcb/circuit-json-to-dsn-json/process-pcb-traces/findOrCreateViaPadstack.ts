import type { DsnPcb, Padstack, Resolution } from "lib/dsn-pcb/types"
import {
  generateLayerNames,
  getViaPadstackName,
} from "lib/utils/generate-layers"
import { micronsToDsnUnits } from "../dsn-unit-conversion"
import type { DsnTraceOperationsWrapper } from "./DsnTraceOperationsWrapper"

export function findOrCreateViaPadstack(
  pcb: DsnTraceOperationsWrapper,
  outerDiameter: number,
  holeDiameter: number,
  numLayers = 2,
  resolution?: Resolution,
): string {
  const viaName = getViaPadstackName(numLayers, outerDiameter, holeDiameter)
  const outerDiameterDsnUnits = micronsToDsnUnits(outerDiameter, resolution)
  const holeDiameterDsnUnits = micronsToDsnUnits(holeDiameter, resolution)

  const library = pcb.getLibrary()

  // Check if padstack already exists
  const existingPadstack = library.padstacks.find((p) => p.name === viaName)

  if (existingPadstack) {
    return viaName
  }

  const viaPadstack: Padstack = {
    name: viaName,
    attach: "off",
    shapes: generateLayerNames(numLayers).map((layer) => ({
      shapeType: "circle" as const,
      layer,
      diameter: outerDiameterDsnUnits,
    })),
    hole: {
      shape: "circle",
      diameter: holeDiameterDsnUnits,
    },
  }

  library.padstacks.push(viaPadstack)
  return viaName
}
