import type {
  AnyCircuitElement,
  PcbComponent,
  PcbPlatedHole,
  PcbPlatedHoleCircle,
  SourceComponentBase,
} from "circuit-json"
import { applyToPoint, scale } from "transformation-matrix"
import type { DsnPcb } from "../types"

const transformMmToUm = scale(1000)

export function processPlatedHoles(
  circuitElements: AnyCircuitElement[],
  pcb: DsnPcb,
) {
  // Group plated holes by component
  const platedHolesByComponent = new Map<string, PcbPlatedHole[]>()

  circuitElements
    .filter(
      (element): element is PcbPlatedHole => element.type === "pcb_plated_hole",
    )
    .forEach((hole) => {
      const componentId = hole.pcb_component_id || ""
      if (!platedHolesByComponent.has(componentId)) {
        platedHolesByComponent.set(componentId, [])
      }
      platedHolesByComponent.get(componentId)?.push(hole)
    })

  const placesByDimensions = new Map<
    string,
    Array<{
      refdes: string
      x: number
      y: number
      rotation: number
    }>
  >()

  // Process each component's plated holes
  for (const [componentId, holes] of platedHolesByComponent) {
    const pcbComponent = circuitElements.find(
      (e) => e.type === "pcb_component" && e.pcb_component_id === componentId,
    ) as PcbComponent | undefined

    const sourceComponent = pcbComponent
      ? (circuitElements.find(
          (e) =>
            e.type === "source_component" &&
            e.source_component_id === pcbComponent.source_component_id,
        ) as SourceComponentBase | undefined)
      : undefined

    const componentName = sourceComponent?.name || `H${componentId}`

    // Check if all holes have the same dimensions
    const firstHole = holes[0] as PcbPlatedHoleCircle
    const allHolesSameDimensions = holes.every(hole => {
      const currentHole = hole as PcbPlatedHoleCircle
      return currentHole.outer_diameter === firstHole.outer_diameter &&
             currentHole.hole_diameter === firstHole.hole_diameter
    })

    const outerDiameterUm = Math.round(firstHole.outer_diameter * 1000)
    const holeDiameterUm = Math.round(firstHole.hole_diameter * 1000)
    
    const imageName = allHolesSameDimensions
      ? `MountingHole:MountingHole_${holeDiameterUm}um_${outerDiameterUm}um_Pad`
      : `MountingHole:MountingHole_Component_${componentId}`

    if (pcbComponent) {
      const circuitSpaceCoordinates = applyToPoint(
        transformMmToUm,
        pcbComponent.center,
      )

      // Group places by dimensions
      if (!placesByDimensions.has(imageName)) {
        placesByDimensions.set(imageName, [])
      }
      placesByDimensions.get(imageName)?.push({
        refdes: componentName,
        x: circuitSpaceCoordinates.x,
        y: -circuitSpaceCoordinates.y,
        rotation: 0,
      })
    }

    // Add or update image in library
    const existingImage = pcb.library.images.find(
      (img) => img.name === imageName,
    )
    if (!existingImage) {
      pcb.library.images.push({
        name: imageName,
        outlines: [],
        pins: holes.map((hole, index) => {
          const platedHoleCircle = hole as PcbPlatedHoleCircle
          const currentOuterDiameterUm = Math.round(platedHoleCircle.outer_diameter * 1000)
          const currentHoleDiameterUm = Math.round(platedHoleCircle.hole_diameter * 1000)
          const padstackName = `Round[A]Pad_${currentHoleDiameterUm}_${currentOuterDiameterUm}_um`

          // Add padstack if not already present
          if (!pcb.library.padstacks.find((p) => p.name === padstackName)) {
            pcb.library.padstacks.push({
              name: padstackName,
              shapes: [
                {
                  shapeType: "circle",
                  layer: "F.Cu",
                  diameter: currentOuterDiameterUm,
                },
                {
                  shapeType: "circle",
                  layer: "B.Cu",
                  diameter: currentOuterDiameterUm,
                },
              ],
              hole: {
                shape: "circle",
                diameter: currentHoleDiameterUm,
              },
              attach: "off",
            })
          }

          return {
            padstack_name: padstackName,
            pin_number: index + 1,
            x: (hole.x - (pcbComponent?.center.x || 0)) * 1000,
            y: -(hole.y - (pcbComponent?.center.y || 0)) * 1000,
          }
        }),
      })
    }
  }

  // Add components to placement after processing all holes
  for (const [imageName, places] of placesByDimensions) {
    pcb.placement.components.push({
      name: imageName,
      places: places.map(place => ({
        refdes: place.refdes,
        x: place.x,
        y: place.y,
        side: "front",
        rotation: place.rotation,
        PN: "",
      })),
    })
  }
}
