import type { AnySourceComponent, PcbPort, SourcePort } from "circuit-json"
import { applyToPoint, type Matrix } from "transformation-matrix"
import type { DsnPcb, Image, Pin } from "lib/dsn-pcb/types"

export const convertDsnPcbComponentsToSourceComponentsAndPorts = ({
  dsnPcb,
  transformDsnUnitToMm,
}: {
  dsnPcb: DsnPcb
  transformDsnUnitToMm: Matrix
}): Array<AnySourceComponent | SourcePort | PcbPort> => {
  const result: Array<AnySourceComponent | SourcePort | PcbPort> = []

  // Map to store image definitions for component lookup
  const imageMap = new Map(dsnPcb.library.images.map((img) => [img.name, img]))

  for (const component of dsnPcb.placement.components) {
    const image = imageMap.get(component.name)
    if (!image) continue

    // Create source component
    const sourceComponent: AnySourceComponent = {
      type: "source_component",
      source_component_id: `sc_${component.name}_${component.place.refdes}`,
      name: component.place.refdes,
      display_value: component.place.PN,
      // Default to simple_chip if no specific type can be determined
      ftype: "simple_chip",
    }
    result.push(sourceComponent)

    // Create ports for each pin in the image
    if (image.pins) {
      for (const pin of image.pins) {
        const port: SourcePort = {
          type: "source_port",
          source_port_id: `source_port_${component.name}-Pad${pin.pin_number}`,
          source_component_id: sourceComponent.source_component_id,
          name: `${component.place.refdes}-${pin.pin_number}`,
          pin_number: pin.pin_number,
          port_hints: [],
        }
        const pcb_port_center = applyToPoint(transformDsnUnitToMm, {
          x: component.place.x + pin.x,
          y: component.place.y + pin.y,
        })
        const pcb_port: PcbPort = {
          pcb_port_id: `pcb_port_${component.name}-Pad${pin.pin_number}`,
          type: "pcb_port",
          source_port_id: port.source_port_id,
          pcb_component_id: component.name,
          x: pcb_port_center.x,
          y: pcb_port_center.y,
          layers: [],
        }
        result.push(port, pcb_port)
      }
    }
  }

  return result
}
