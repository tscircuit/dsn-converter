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
        for (let pinIdx = 0; pinIdx < image.pins.length; pinIdx++) {
          const pin = image.pins[pinIdx]
          // Resolve pin_number to an integer. For non-numeric pin names (e.g.
          // "GND2", "A", "C", "+") use the pin's 1-based index within the
          // image so that every source_port carries a valid pin_number.
          const numericValue = Number(pin.pin_number)
          const resolvedPinNumber = Number.isNaN(numericValue)
            ? pinIdx + 1
            : numericValue
          // Preserve the original non-numeric name as a port hint so callers
          // that need the schematic name (e.g. "A", "GND2") can retrieve it.
          const portHints: string[] =
            typeof pin.pin_number === "string" &&
            Number.isNaN(Number(pin.pin_number))
              ? [pin.pin_number]
              : []
          const port: SourcePort = {
            type: "source_port",
            source_port_id: `source_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pin.pin_number}`,
            pin_number: resolvedPinNumber,
            port_hints: portHints,
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
