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
        // Component placement rotation in radians
        const compRotRad = ((place.rotation || 0) * Math.PI) / 180

        for (let pinIndex = 0; pinIndex < image.pins.length; pinIndex++) {
          const pin = image.pins[pinIndex]

          // Normalize pin label: handle non-numeric and NaN pin numbers
          const parsedPinNumber = Number(pin.pin_number)
          const pinLabel =
            typeof pin.pin_number === "number" && Number.isNaN(pin.pin_number)
              ? String(pinIndex + 1)
              : String(pin.pin_number)

          const port: SourcePort = {
            type: "source_port",
            source_port_id: `source_port_${component.name}-Pad${pinLabel}_${place.refdes}_${pinIndex}`,
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pinLabel}`,
            pin_number: Number.isNaN(parsedPinNumber)
              ? pinIndex + 1
              : parsedPinNumber,
            port_hints: [],
          }

          // Handle case where place coordinates might be null/undefined
          const placeX = place.x || 0
          const placeY = place.y || 0

          // Apply component rotation to pin offset
          let pinOffsetX = pin.x
          let pinOffsetY = pin.y
          if (compRotRad !== 0) {
            const cos = Math.cos(compRotRad)
            const sin = Math.sin(compRotRad)
            pinOffsetX = pin.x * cos - pin.y * sin
            pinOffsetY = pin.x * sin + pin.y * cos
          }

          const pcb_port_center = applyToPoint(transformDsnUnitToMm, {
            x: placeX + pinOffsetX,
            y: placeY + pinOffsetY,
          })
          const pcb_port: PcbPort = {
            pcb_port_id: `pcb_port_${component.name}-Pad${pinLabel}_${place.refdes}_${pinIndex}`,
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
