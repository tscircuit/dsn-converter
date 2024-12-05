import type {
  AnyCircuitElement,
  PcbComponent,
  PcbPlatedHole,
  PcbPlatedHoleCircle,
  SourceComponentBase,
  PcbPlatedHoleOval,
} from "circuit-json"
import { applyToPoint, scale } from "transformation-matrix"
import type { DsnPcb } from "../types"
import { createOvalPadstack } from "lib/utils/create-padstack"

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

    // Skip if any hole is oval shaped
    if (holes.some((hole) => hole.shape === "oval")) {
      throw new Error("Oval plated holes are not supported")
    }

    // Check if all holes have same shape and dimensions
    const firstHole = holes[0]
    const allHolesSameDimensions = holes.every((hole) => {
      if (hole.shape !== firstHole.shape) return false

      if (hole.shape === "pill") {
        const current = hole as PcbPlatedHoleOval
        const first = firstHole as PcbPlatedHoleOval
        return (
          current.outer_width === first.outer_width &&
          current.outer_height === first.outer_height &&
          current.hole_width === first.hole_width &&
          current.hole_height === first.hole_height
        )
      } else {
        const current = hole as PcbPlatedHoleCircle
        const first = firstHole as PcbPlatedHoleCircle
        return (
          current.outer_diameter === first.outer_diameter &&
          current.hole_diameter === first.hole_diameter
        )
      }
    })

    let imageName: string
    if (allHolesSameDimensions) {
      if (firstHole.shape === "pill") {
        const pillHole = firstHole
        const holeWidthUm = Math.round(pillHole.hole_width * 1000)
        const holeHeightUm = Math.round(pillHole.hole_height * 1000)
        const outerWidthUm = Math.round(pillHole.outer_width * 1000)
        const outerHeightUm = Math.round(pillHole.outer_height * 1000)
        imageName = `MountingHole:MountingHole_${holeWidthUm}x${holeHeightUm}um_${outerWidthUm}x${outerHeightUm}um_${holes.length}_Pad`
      } else {
        const circleHole = firstHole as PcbPlatedHoleCircle
        const holeDiameterUm = Math.round(circleHole.hole_diameter * 1000)
        const outerDiameterUm = Math.round(circleHole.outer_diameter * 1000)
        imageName = `MountingHole:MountingHole_${holeDiameterUm}um_${outerDiameterUm}um_${holes.length}_Pad`
      }
    } else {
      imageName = `MountingHole:MountingHole_Component_${componentId}`
    }

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
          let padstackName: string

          if (hole.shape === "pill") {
            const pillHole = hole
            const outerWidthUm = Math.round(pillHole.outer_width * 1000)
            const outerHeightUm = Math.round(pillHole.outer_height * 1000)
            const holeWidthUm = Math.round(pillHole.hole_width * 1000)
            const holeHeightUm = Math.round(pillHole.hole_height * 1000)
            padstackName = `Oval[A]Pad_${outerWidthUm}x${outerHeightUm}_um`

            // Add padstack if not already present
            if (!pcb.library.padstacks.find((p) => p.name === padstackName)) {
              pcb.library.padstacks.push(
                createOvalPadstack(
                  padstackName,
                  outerWidthUm,
                  outerHeightUm,
                  holeWidthUm,
                  holeHeightUm,
                ),
              )
            }
          } else {
            const circleHole = hole as PcbPlatedHoleCircle
            const outerDiameterUm = Math.round(circleHole.outer_diameter * 1000)
            const holeDiameterUm = Math.round(circleHole.hole_diameter * 1000)
            padstackName = `Round[A]Pad_${holeDiameterUm}_${outerDiameterUm}_um`

            // Add padstack if not already present
            if (!pcb.library.padstacks.find((p) => p.name === padstackName)) {
              pcb.library.padstacks.push({
                name: padstackName,
                shapes: [
                  {
                    shapeType: "circle",
                    layer: "F.Cu",
                    diameter: outerDiameterUm,
                  },
                  {
                    shapeType: "circle",
                    layer: "B.Cu",
                    diameter: outerDiameterUm,
                  },
                ],
                hole: {
                  shape: "circle",
                  diameter: holeDiameterUm,
                },
                attach: "off",
              })
            }
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
    // Filter out places whose refdes already exists in any component
    const newPlaces = places.filter((place) => 
      !pcb.placement.components.some((comp) =>
        comp.places.some((existingPlace) => existingPlace.refdes === place.refdes)
      )
    );

    // Only add component if there are any new places to add
    if (newPlaces.length > 0) {
      pcb.placement.components.push({
        name: imageName,
        places: newPlaces.map((place) => ({
          refdes: place.refdes,
          x: place.x,
          y: place.y,
          side: "front",
          rotation: place.rotation,
          PN: "",
        })),
      });
    }
  }
}
