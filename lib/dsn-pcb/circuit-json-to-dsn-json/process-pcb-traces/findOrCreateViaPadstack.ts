import type { DsnPcb, Padstack } from "lib/dsn-pcb/types"
import {
  generateLayerNames,
  getViaPadstackName,
} from "lib/utils/generate-layers"
import type { DsnTraceOperationsWrapper } from "./DsnTraceOperationsWrapper"

export function findOrCreateViaPadstack(
  pcb: DsnTraceOperationsWrapper,
  outerDiameter: number,
  holeDiameter: number,
  numLayers = 2,
): string {
  const viaName = getViaPadstackName(numLayers, outerDiameter, holeDiameter)

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
      diameter: outerDiameter,
    })),
    hole: {
      shape: "circle",
      diameter: holeDiameter,
    },
  }

  library.padstacks.push(viaPadstack)
  return viaName
}
