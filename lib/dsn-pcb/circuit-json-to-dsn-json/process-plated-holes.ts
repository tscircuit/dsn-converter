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

    holes.forEach((platedHole) => {
      // Skip oval plated holes
      if (platedHole.shape === "oval") {
        throw new Error("Oval plated holes are not supported")
      }

      let padstackName: string
      let imageName: string
      let outerDiameterUm = 0
      let holeDiameterUm = 0

      if (platedHole.shape === "pill") {
        const pillHole = platedHole
        const outerWidthUm = Math.round(pillHole.outer_width * 1000)
        const outerHeightUm = Math.round(pillHole.outer_height * 1000)
        const holeWidthUm = Math.round(pillHole.hole_width * 1000)
        const holeHeightUm = Math.round(pillHole.hole_height * 1000)
        
        imageName = `MountingHole:MountingHole_${holeWidthUm}x${holeHeightUm}um_${outerWidthUm}x${outerHeightUm}um_Pad`
        padstackName = `Oval[A]Pad_${outerWidthUm}x${outerHeightUm}_um`
      } else {
        const platedHoleCircle = platedHole as PcbPlatedHoleCircle
        outerDiameterUm = Math.round(platedHoleCircle.outer_diameter * 1000)
        holeDiameterUm = Math.round(platedHoleCircle.hole_diameter * 1000)
        
        imageName = `MountingHole:MountingHole_${holeDiameterUm}um_${outerDiameterUm}um_Pad`
        padstackName = `Round[A]Pad_${holeDiameterUm}_${outerDiameterUm}_um`
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
          pins: [{
            padstack_name: padstackName,
            pin_number: 1,
            x: (platedHole.x - (pcbComponent?.center.x || 0)) * 1000,
            y: -(platedHole.y - (pcbComponent?.center.y || 0)) * 1000,
          }],
        })
      }

      // Add padstack if not already present
      if (!pcb.library.padstacks.find((p) => p.name === padstackName)) {
        if (platedHole.shape === "pill") {
          const pillHole = platedHole
          const outerWidthUm = Math.round(pillHole.outer_width * 1000)
          const outerHeightUm = Math.round(pillHole.outer_height * 1000)
          const pathOffset = (outerWidthUm - outerHeightUm) / 2

          pcb.library.padstacks.push({
            name: padstackName,
            shapes: [
              {
                shapeType: "path",
                layer: "F.Cu",
                width: outerHeightUm,
                coordinates: [-pathOffset, 0, pathOffset, 0]
              },
              {
                shapeType: "path",
                layer: "B.Cu",
                width: outerHeightUm,
                coordinates: [-pathOffset, 0, pathOffset, 0]
              }
            ],
            hole: {
              shape: "oval",
              width: Math.round(pillHole.hole_width * 1000),
              height: Math.round(pillHole.hole_height * 1000)
            },
            attach: "off"
          })
        } else {
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
    })
  }

  // Add components to placement after processing all holes
  for (const [imageName, places] of placesByDimensions) {
    pcb.placement.components.push({
      name: imageName,
      places: places.map((place) => ({
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