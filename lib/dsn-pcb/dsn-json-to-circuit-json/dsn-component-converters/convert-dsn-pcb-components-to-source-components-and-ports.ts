import type {
  AnySourceComponent,
  PcbComponent,
  PcbPort,
  SourcePort,
} from "circuit-json"
import type { DsnPcb } from "lib/dsn-pcb/types"
import { type Matrix, applyToPoint } from "transformation-matrix"
import {
  getDsnPcbComponentId,
  getDsnPcbPortId,
  getDsnSourceComponentId,
  getDsnSourcePortId,
  getImageBounds,
  getNumericPinNumber,
  transformPinOffset,
} from "./component-placement"

export const convertDsnPcbComponentsToSourceComponentsAndPorts = ({
  dsnPcb,
  transformDsnUnitToMm,
}: {
  dsnPcb: DsnPcb
  transformDsnUnitToMm: Matrix
}): Array<AnySourceComponent | SourcePort | PcbComponent | PcbPort> => {
  const result: Array<
    AnySourceComponent | SourcePort | PcbComponent | PcbPort
  > = []

  // Map to store image definitions for component lookup
  const imageMap = new Map(dsnPcb.library.images.map((img) => [img.name, img]))

  for (const component of dsnPcb.placement.components) {
    const image = imageMap.get(component.name)
    if (!image) continue

    // Create source component for each place
    component.places.forEach((place) => {
      const sourceComponentId = getDsnSourceComponentId(
        component.name,
        place.refdes,
      )
      const pcbComponentId = getDsnPcbComponentId(component.name, place.refdes)
      const sourceComponent: AnySourceComponent = {
        type: "source_component",
        source_component_id: sourceComponentId,
        name: place.refdes,
        display_value: place.PN,
        // Default to simple_chip if no specific type can be determined
        ftype: "simple_chip",
      }
      const componentCenter = applyToPoint(transformDsnUnitToMm, {
        x: place.x || 0,
        y: place.y || 0,
      })
      const imageBounds = getImageBounds(image)
      const pcbComponent: PcbComponent = {
        type: "pcb_component",
        pcb_component_id: pcbComponentId,
        source_component_id: sourceComponentId,
        center: componentCenter,
        layer: place.side === "back" ? "bottom" : "top",
        rotation: place.rotation,
        width: imageBounds.width,
        height: imageBounds.height,
        obstructs_within_bounds: true,
      }
      result.push(sourceComponent, pcbComponent)

      // Create ports for each pin in the image
      if (image.pins) {
        for (const [pinIndex, pin] of image.pins.entries()) {
          const numericPinNumber = getNumericPinNumber(pin)
          const port: SourcePort = {
            type: "source_port",
            source_port_id: getDsnSourcePortId({
              componentName: component.name,
              refdes: place.refdes,
              pin,
              pinIndex,
            }),
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pin.pin_number}`,
            port_hints: [String(pin.pin_number)],
          }
          if (numericPinNumber !== undefined) {
            port.pin_number = numericPinNumber
          }
          // Handle case where place coordinates might be null/undefined
          const placeX = place.x || 0
          const placeY = place.y || 0
          const pinOffset = transformPinOffset(pin, place)
          const pcb_port_center = applyToPoint(transformDsnUnitToMm, {
            x: placeX + pinOffset.x,
            y: placeY + pinOffset.y,
          })
          const pcb_port: PcbPort = {
            pcb_port_id: getDsnPcbPortId({
              componentName: component.name,
              refdes: place.refdes,
              pin,
              pinIndex,
            }),
            type: "pcb_port",
            source_port_id: port.source_port_id,
            pcb_component_id: pcbComponentId,
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
