import type {
  AnySourceComponent,
  PcbPort,
  SourcePort,
  PcbComponent,
} from "circuit-json"
import type { DsnPcb, Image, Pin } from "lib/dsn-pcb/types"
import { type Matrix, applyToPoint } from "transformation-matrix"

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

    // Create source component for each place
    component.places.forEach((place) => {
      const pcb_component_id = `${component.name}_${place.refdes}`
      const sourceComponent: AnySourceComponent = {
        type: "source_component",
        source_component_id: `sc_${component.name}_${place.refdes}`,
        name: place.refdes,
        display_value: place.PN,
        // Default to simple_chip if no specific type can be determined
        ftype: "simple_chip",
      }
      result.push(sourceComponent)

      // Calculate absolute center for pcb_component
      const placeX = place.x || 0
      const placeY = place.y || 0
      const pcb_component_center = applyToPoint(transformDsnUnitToMm, {
        x: placeX,
        y: placeY,
      })

      const pcbComponent: PcbComponent = {
        type: "pcb_component",
        pcb_component_id,
        source_component_id: sourceComponent.source_component_id,
        center: pcb_component_center,
        rotation: place.rotation || 0,
        layer: place.side === "back" ? "bottom" : "top",
        width: 0,
        height: 0,
        obstructs_within_bounds: true,
      }
      result.push(pcbComponent)

      // Create ports for each pin in the image
      if (image.pins) {
        for (const pin of image.pins) {
          const rotationRad = (place.rotation * Math.PI) / 180
          const cos = Math.cos(rotationRad)
          const sin = Math.sin(rotationRad)

          // Rotate pin coordinates
          const rotatedPinX = pin.x * cos - pin.y * sin
          const rotatedPinY = pin.x * sin + pin.y * cos

          const pcb_port_center = applyToPoint(transformDsnUnitToMm, {
            x: placeX + rotatedPinX,
            y: placeY + rotatedPinY,
          })

          const pinNum =
            typeof pin.pin_number === "string" && !isNaN(Number(pin.pin_number))
              ? Number(pin.pin_number)
              : pin.pin_number

          const port: SourcePort = {
            type: "source_port",
            source_port_id: `source_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pin.pin_number}`,
            pin_number: pinNum as any,
            port_hints: [],
          }

          const pcb_port: PcbPort = {
            pcb_port_id: `pcb_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            type: "pcb_port",
            source_port_id: port.source_port_id,
            pcb_component_id,
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
