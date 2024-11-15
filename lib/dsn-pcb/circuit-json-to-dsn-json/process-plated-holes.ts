import type { AnyCircuitElement, PcbPlatedHole } from "circuit-json"
import type { DsnPcb } from "../types"

export function processPlatedHoles(
  circuitElements: AnyCircuitElement[],
  pcb: DsnPcb,
) {
  // Find all plated holes
  const platedHoles = circuitElements.filter(
    (element) => element.type === "pcb_plated_hole",
  ) as PcbPlatedHole[]

  // Process each plated hole
  for (let i = 0; i < platedHoles.length; i++) {
    const hole = platedHoles[i]
    const holeNumber = i + 1
    const holeName = `H${holeNumber}`

    // Add component to placement
    pcb.placement.components.push({
      name: "MountingHole:MountingHole_3.2mm_Pad",
      place: {
        refdes: holeName,
        x: hole.x * 1000, // Convert mm to μm
        y: -hole.y * 1000, // Convert mm to μm and flip Y coordinate
        side: "front",
        rotation: 0,
        PN: "",
      },
    })

    // Add image to library if not already present
    const imageName = "MountingHole:MountingHole_3.2mm_Pad"
    if (!pcb.library.images.find((img) => img.name === imageName)) {
      pcb.library.images.push({
        name: imageName,
        outlines: [],
        pins: [
          {
            padstack_name: "Round[A]Pad_6000_um",
            pin_number: 1,
            x: 0,
            y: 0,
          },
        ],
      })
    }

    // Add padstack if not already present
    const padstackName = "Round[A]Pad_6000_um"
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

    // Add to mounting holes net
    const mountingHolesNet = pcb.network.nets.find(
      (net) => net.name === "MountingHoles",
    )
    if (mountingHolesNet) {
      mountingHolesNet.pins.push(`${holeName}-1`)
    } else {
      pcb.network.nets.push({
        name: "MountingHoles",
        pins: [`${holeName}-1`],
      })
      // Add to default class net names
      pcb.network.classes[0].net_names.push("MountingHoles")
    }
  }
}
