import type { AnySourceComponent, PcbPort, SourcePort } from "circuit-json"
import type { DsnPcb, Image, Pin } from "lib/dsn-pcb/types"
import { type Matrix, applyToPoint } from "transformation-matrix"

const rotatePoint = (x: number, y: number, rotationDeg = 0) => {
  const rotationRad = (rotationDeg * Math.PI) / 180
  return {
    x: x * Math.cos(rotationRad) - y * Math.sin(rotationRad),
    y: x * Math.sin(rotationRad) + y * Math.cos(rotationRad),
  }
}

const getNumericPinNumber = (pin: Pin) => {
  const pinNumber = Number(pin.pin_number)
  return Number.isFinite(pinNumber) ? pinNumber : undefined
}

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
          const port: SourcePort = {
            type: "source_port",
            source_port_id: `source_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pin.pin_number}`,
            port_hints: [String(pin.pin_number)],
          }
          const numericPinNumber = getNumericPinNumber(pin)
          if (numericPinNumber !== undefined) {
            port.pin_number = numericPinNumber
          }
          // Handle case where place coordinates might be null/undefined
          const placeX = place.x || 0
          const placeY = place.y || 0
          const rotatedPin = rotatePoint(pin.x, pin.y, place.rotation)
          const pcb_port_center = applyToPoint(transformDsnUnitToMm, {
            x: placeX + rotatedPin.x,
            y: placeY + rotatedPin.y,
          })
          const pcb_port: PcbPort = {
            pcb_port_id: `pcb_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            type: "pcb_port",
            source_port_id: port.source_port_id,
            pcb_component_id: `${component.name}_${place.refdes}`,
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
