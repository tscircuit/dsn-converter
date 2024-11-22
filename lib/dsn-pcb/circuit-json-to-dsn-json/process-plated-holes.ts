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

    // Add component placement once per component
    if (pcbComponent) {
      const circuitSpaceCoordinates = applyToPoint(
        transformMmToUm,
        pcbComponent.center,
      )

      pcb.placement.components.push({
        name: imageName,
        place: {
          refdes: componentName,
          x: circuitSpaceCoordinates.x,
          y: -circuitSpaceCoordinates.y, // Flip Y coordinate
          side: "front",
          rotation: pcbComponent.rotation || 0,
          PN: "",
        },
      })
    }

    // Add image to library if not already present
    if (!pcb.library.images.find((img) => img.name === imageName)) {
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
