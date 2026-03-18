/**
 * Returns just the layer name strings for a given layer count.
 * e.g. 4 → ["F.Cu", "In1.Cu", "In2.Cu", "B.Cu"]
 */
export function generateLayerNames(numLayers: number): string[] {
  const names: string[] = ["F.Cu"]
  for (let i = 1; i < numLayers - 1; i++) {
    names.push(`In${i}.Cu`)
  }
  names.push("B.Cu")
  return names
}

/**
 * Returns the via padstack name for a through-hole via spanning all layers.
 * e.g. 2 → "Via[0-1]_600:300_um", 4 → "Via[0-3]_600:300_um"
 */
export function getViaPadstackName(
  numLayers: number,
  outerDiameter: number,
  holeDiameter: number,
): string {
  return `Via[0-${numLayers - 1}]_${outerDiameter}:${holeDiameter}_um`
}

export function generateLayers(numLayers: number) {
  const layers = []

  // Always add F.Cu as the first layer (index 0)
  layers.push({
    name: "F.Cu",
    type: "signal" as const,
    property: {
      index: 0,
    },
  })

  // Add inner layers (In1.Cu, In2.Cu, etc.)
  for (let i = 1; i < numLayers - 1; i++) {
    layers.push({
      name: `In${i}.Cu`,
      type: "signal" as const,
      property: {
        index: i,
      },
    })
  }

  // Always add B.Cu as the last layer (index numLayers - 1)
  layers.push({
    name: "B.Cu",
    type: "signal" as const,
    property: {
      index: numLayers - 1,
    },
  })

  return layers
}
