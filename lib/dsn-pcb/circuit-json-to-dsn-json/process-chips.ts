import type {
  AnyCircuitElement,
  PcbComponent,
  PcbPort,
  SourceComponentBase,
  SourcePort,
} from "circuit-json"
import type { DsnPcb } from "../types"

export function processChips(
  circuitElements: AnyCircuitElement[],
  pcb: DsnPcb,
) {
  // Group pcb_port by component
  const portsByComponent = new Map<string, PcbPort[]>()

  // Find all source components that are simple_chips
  const chipComponents = circuitElements.filter(
    (e) => e.type === "source_component" && e.ftype === "simple_chip",
  ) as SourceComponentBase[]

  // Find all pcb_ports for each chip component
  chipComponents.forEach((chip) => {
    const componentPorts = circuitElements.filter((e): e is PcbPort => {
      if (e.type !== "pcb_port") return false
      // Find the source port this pcb_port is connected to
      const sourcePort = circuitElements.find(
        (sp): sp is SourcePort =>
          sp.type === "source_port" && sp.source_port_id === e.source_port_id,
      ) as SourcePort | undefined
      // Check if the source port belongs to this chip
      return sourcePort?.source_component_id === chip.source_component_id
    })

    if (componentPorts.length > 0) {
      portsByComponent.set(chip.source_component_id, componentPorts)
    }
  })

  // Process each chip component
  chipComponents.forEach((chip) => {
    const ports = portsByComponent.get(chip.source_component_id)
    if (!ports) return

    // Create or update image for this chip
    const imageName = `${chip.name}_footprint`
    const existingImage = pcb.library.images.find(
      (img) => img.name === imageName,
    )

    if (!existingImage) {
      // Create new image with pins from ports
      pcb.library.images.push({
        name: imageName,
        outlines: [],
        pins: ports.map((port, index) => ({
          padstack_name: `default_pad_${imageName}`,
          pin_number: index + 1,
          x: port.x * 1000, // Convert mm to μm
          y: port.y * 1000,
        })),
      })

      // Add padstack if not exists
      if (
        !pcb.library.padstacks.find(
          (p) => p.name === `default_pad_${imageName}`,
        )
      ) {
        pcb.library.padstacks.push({
          name: `default_pad_${imageName}`,
          shapes: [
            {
              shapeType: "polygon",
              layer: "F.Cu",
              width: 0,
              coordinates: [
                -300, 300, 300, 300, 300, -300, -300, -300, -300, 300,
              ],
            },
          ],
          attach: "off",
        })
      }

      // Find corresponding pcb_component
      const pcbComponent = circuitElements.find(
        (e): e is PcbComponent =>
          e.type === "pcb_component" &&
          e.source_component_id === chip.source_component_id,
      ) as PcbComponent | undefined

      if (pcbComponent) {
        // Add component placement using pcb_component coordinates
        pcb.placement.components.push({
          name: imageName,
          places: [
            {
              refdes: chip.name,
              x: pcbComponent.center.x * 1000, // Convert mm to μm
              y: pcbComponent.center.y * 1000,
              side: "front",
              rotation: 0,
              PN: chip.manufacturer_part_number || "",
            },
          ],
        })
      }
    }
  })
}
