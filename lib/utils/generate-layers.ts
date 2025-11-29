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
