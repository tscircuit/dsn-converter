import type { DsnPcb, Padstack } from "lib/dsn-pcb/types"
import type { DsnTraceOperationsWrapper } from "./DsnTraceOperationsWrapper"

export function findOrCreateViaPadstack(
  pcb: DsnTraceOperationsWrapper,
  outerDiameter: number,
  holeDiameter: number,
): string {
  const viaName = `Via[0-1]_${outerDiameter}:${holeDiameter}_um`

  const library = pcb.getLibrary()

  // Check if padstack already exists
  const existingPadstack = library.padstacks.find((p) => p.name === viaName)

  if (existingPadstack) {
    return viaName
  }

  // Create new padstack for via
  const viaPadstack: Padstack = {
    name: viaName,
    attach: "off",
    shapes: [
      {
        shapeType: "circle",
        layer: "F.Cu",
        diameter: outerDiameter,
      },
      {
        shapeType: "circle",
        layer: "B.Cu",
        diameter: outerDiameter,
      },
    ],
    hole: {
      shape: "circle",
      diameter: holeDiameter,
    },
  }

  library.padstacks.push(viaPadstack)
  return viaName
}
