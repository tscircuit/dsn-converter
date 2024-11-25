import type {
  AnyCircuitElement,
  PcbComponent,
  PcbPlatedHole,
  SourceComponentBase,
} from "circuit-json"
import type { DsnPcb } from "../types"
import { applyToPoint, scale } from "transformation-matrix"

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
    const imageName = "MountingHole:MountingHole_3.2mm_Pad"
    const padstackName = "Round[A]Pad_6000_um"

    // Group all holes by image name
    const placesByImage = new Map<
      string,
      Array<{
        refdes: string
        x: number
        y: number
        rotation: number
      }>
    >()

    if (pcbComponent) {
      const circuitSpaceCoordinates = applyToPoint(
        transformMmToUm,
        pcbComponent.center,
      )

      // Add to places collection
      if (!placesByImage.has(imageName)) {
        placesByImage.set(imageName, [])
      }
      placesByImage.get(imageName)?.push({
        refdes: componentName,
        x: circuitSpaceCoordinates.x,
        y: -circuitSpaceCoordinates.y, // Flip Y coordinate
        rotation: 0,
      })
    }

    // Add single component with all places
    if (placesByImage.size > 0) {
      // Check if component with this image name already exists
      const existingComponent = pcb.placement.components.find(
        (comp) => comp.name === imageName,
      )

      if (existingComponent) {
        // Add new places to existing component
        existingComponent.places.push(
          ...placesByImage.get(imageName)!.map((place) => ({
            refdes: place.refdes,
            x: place.x,
            y: place.y,
            side: "front" as const,
            rotation: place.rotation,
            PN: "",
          })),
        )
      } else {
        // Create new component
        pcb.placement.components.push({
          name: imageName,
          places: placesByImage.get(imageName)!.map((place) => ({
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

    // Add or update image in library
    const existingImage = pcb.library.images.find(
      (img) => img.name === imageName,
    )
    if (!existingImage) {
      pcb.library.images.push({
        name: imageName,
        outlines: [],
        pins: holes.map((hole, index) => ({
          padstack_name: padstackName,
          pin_number: index + 1,
          x: (hole.x - (pcbComponent?.center.x || 0)) * 1000,
          y: -(hole.y - (pcbComponent?.center.y || 0)) * 1000,
        })),
      })
    }

    // Add padstack if not already present
    if (!pcb.library.padstacks.find((p) => p.name === padstackName)) {
      pcb.library.padstacks.push({
        name: padstackName,
        shapes: [
          {
            shapeType: "circle",
            layer: "F.Cu",
            diameter: 600,
          },
          {
            shapeType: "circle",
            layer: "B.Cu",
            diameter: 600,
          },
        ],
        attach: "off",
      })
    }
  }
}
