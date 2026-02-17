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
        const rotationRad = ((place.rotation || 0) * Math.PI) / 180
        for (let pinIdx = 0; pinIdx < image.pins.length; pinIdx++) {
          const pin = image.pins[pinIdx]
          // For non-numeric pin names, use the index as pin_number
          const numericPinNumber =
            typeof pin.pin_number === "number"
              ? pin.pin_number
              : parseInt(String(pin.pin_number), 10) || pinIdx + 1
          const port: SourcePort = {
            type: "source_port",
            source_port_id: `source_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pin.pin_number}`,
            pin_number: numericPinNumber,
            port_hints: [],
          }
          // Handle case where place coordinates might be null/undefined
          const placeX = place.x || 0
          const placeY = place.y || 0

          // Apply component rotation to pin offset
          const rotatedPinX =
            pin.x * Math.cos(rotationRad) - pin.y * Math.sin(rotationRad)
          const rotatedPinY =
            pin.x * Math.sin(rotationRad) + pin.y * Math.cos(rotationRad)

          const pcb_port_center = applyToPoint(transformDsnUnitToMm, {
            x: placeX + rotatedPinX,
            y: placeY + rotatedPinY,
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
