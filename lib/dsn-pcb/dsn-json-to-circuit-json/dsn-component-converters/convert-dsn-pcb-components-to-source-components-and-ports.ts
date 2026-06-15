import type {
  AnySourceComponent,
  PcbComponent,
  PcbPort,
  SourcePort,
} from "circuit-json"
import type { DsnPcb, Image, Pin } from "lib/dsn-pcb/types"
import { type Matrix, applyToPoint } from "transformation-matrix"

/**
 * Rotate a point (x, y) around the origin by the given angle in degrees.
 */
function rotatePoint(
  x: number,
  y: number,
  angleDeg: number,
): { x: number; y: number } {
  if (!angleDeg) return { x, y }
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  }
}

export const convertDsnPcbComponentsToSourceComponentsAndPorts = ({
  dsnPcb,
  transformDsnUnitToMm,
}: {
  dsnPcb: DsnPcb
  transformDsnUnitToMm: Matrix
}): Array<AnySourceComponent | SourcePort | PcbPort | PcbComponent> => {
  const result: Array<
    AnySourceComponent | SourcePort | PcbPort | PcbComponent
  > = []

  // Map to store image definitions for component lookup
  const imageMap = new Map(dsnPcb.library.images.map((img) => [img.name, img]))

  for (const component of dsnPcb.placement.components) {
    const image = imageMap.get(component.name)
    if (!image) continue

    // Create source component and pcb_component for each place
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

      // Handle case where place coordinates might be null/undefined
      const placeX = place.x || 0
      const placeY = place.y || 0
      const placeRotation = place.rotation || 0

      // Create pcb_component
      const pcbComponentCenter = applyToPoint(transformDsnUnitToMm, {
        x: placeX,
        y: placeY,
      })
      const pcbComponent: PcbComponent = {
        type: "pcb_component",
        pcb_component_id: `${component.name}_${place.refdes}`,
        source_component_id: sourceComponent.source_component_id,
        center: pcbComponentCenter,
        rotation: placeRotation,
        width: 0,
        height: 0,
        layer: place.side === "back" ? "bottom" : "top",
        obstructs_within_bounds: false,
      }
      result.push(pcbComponent)

      // Create ports for each pin in the image
      if (image.pins) {
        for (const pin of image.pins) {
          // pin_number can be non-numeric (e.g. "GND2", "A", "C")
          const pinNumValue = Number(pin.pin_number)
          const port: SourcePort = {
            type: "source_port",
            source_port_id: `source_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pin.pin_number}`,
            pin_number: Number.isNaN(pinNumValue) ? 0 : pinNumValue,
            port_hints: [],
          }

          // Apply component rotation to pin offset
          const rotatedPin = rotatePoint(pin.x, pin.y, placeRotation)

          const pcb_port_center = applyToPoint(transformDsnUnitToMm, {
            x: placeX + rotatedPin.x,
            y: placeY + rotatedPin.y,
          })
          const pcb_port: PcbPort = {
            pcb_port_id: `pcb_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            type: "pcb_port",
            source_port_id: port.source_port_id,
            pcb_component_id: pcbComponent.pcb_component_id,
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
