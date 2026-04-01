import type { AnySourceComponent, PcbPort, SourcePort } from "circuit-json"
import type { DsnPcb, Image, Pin } from "lib/dsn-pcb/types"
import { type Matrix, applyToPoint } from "transformation-matrix"

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

    // Create source component for each place
    component.places.forEach((place) => {
      const sourceComponent: AnySourceComponent = {
        type: "source_component",
        source_component_id: `sc_${component.name}_${place.refdes}`,
        name: place.refdes,
        display_value: place.PN,
        // Default to simple_chip if no specific type can be determined
        ftype: "simple_chip",
      }
      result.push(sourceComponent)

      // Create ports for each pin in the image
      if (image.pins) {
        for (const pin of image.pins) {
          // circuit-json's SourcePort.pin_number is typed as `number | undefined`.
          // DSN pin identifiers can be numeric ("1", "100") or named ("GND1", "GND2",
          // "+", "-", "A", "C"). For numeric pins, convert to a number. For named
          // pins, omit pin_number and store the label in port_hints so downstream
          // consumers can still resolve the port identity.
          const pinLabel = String(pin.pin_number ?? "")
          const isNumeric = /^\d+$/.test(pinLabel)
          const pinNum: number | undefined = isNumeric
            ? Number(pinLabel)
            : undefined

          const port: SourcePort = {
            type: "source_port",
            source_port_id: `source_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pin.pin_number}`,
            pin_number: pinNum,
            port_hints: isNumeric ? [] : [pinLabel],
          }
          // Handle case where place coordinates might be null/undefined
          const placeX = place.x || 0
          const placeY = place.y || 0
          const pcb_port_center = applyToPoint(transformDsnUnitToMm, {
            x: placeX + pin.x,
            y: placeY + pin.y,
          })
          const pcb_port: PcbPort = {
            pcb_port_id: `pcb_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            type: "pcb_port",
            source_port_id: port.source_port_id,
            pcb_component_id: component.name,
            x: pcb_port_center.x,
            y: pcb_port_center.y,
            layers: [place.side === "back" ? "bottom" : "top"],
          }
          result.push(port, pcb_port)
        }
      }
    })
  }

  return result
}
