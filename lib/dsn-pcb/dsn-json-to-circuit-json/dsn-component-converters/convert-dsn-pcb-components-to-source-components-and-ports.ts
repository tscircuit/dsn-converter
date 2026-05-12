import type {
  AnySourceComponent,
  PcbComponent,
  PcbPort,
  SourcePort,
} from "circuit-json"
import type { DsnPcb, Image, Pin } from "lib/dsn-pcb/types"
import { getNumericPinNumber } from "lib/utils/normalize-pin-number"
import { type Matrix, applyToPoint } from "transformation-matrix"

export const convertDsnPcbComponentsToSourceComponentsAndPorts = ({
  dsnPcb,
  transformDsnUnitToMm,
}: {
  dsnPcb: DsnPcb
  transformDsnUnitToMm: Matrix
}): Array<AnySourceComponent | PcbComponent | SourcePort | PcbPort> => {
  const result: Array<
    AnySourceComponent | PcbComponent | SourcePort | PcbPort
  > = []

  // Map to store image definitions for component lookup
  const imageMap = new Map(dsnPcb.library.images.map((img) => [img.name, img]))

  for (const component of dsnPcb.placement.components) {
    const image = imageMap.get(component.name)
    if (!image) continue

    // Create source component for each place
    component.places.forEach((place) => {
      const pcbComponentId = `${component.name}_${place.refdes}`
      const sourceComponent: AnySourceComponent = {
        type: "source_component",
        source_component_id: `sc_${component.name}_${place.refdes}`,
        name: place.refdes,
        display_value: place.PN,
        // Default to simple_chip if no specific type can be determined
        ftype: "simple_chip",
      }

      const center = applyToPoint(transformDsnUnitToMm, {
        x: place.x || 0,
        y: place.y || 0,
      })
      const pinCenters =
        image.pins?.map((pin) =>
          applyToPoint(transformDsnUnitToMm, {
            x: (place.x || 0) + pin.x,
            y: (place.y || 0) + pin.y,
          }),
        ) ?? []
      const xs = pinCenters.map((point) => point.x)
      const ys = pinCenters.map((point) => point.y)
      const width = xs.length > 0 ? Math.max(...xs) - Math.min(...xs) : 0
      const height = ys.length > 0 ? Math.max(...ys) - Math.min(...ys) : 0

      const pcbComponent: PcbComponent = {
        type: "pcb_component",
        pcb_component_id: pcbComponentId,
        source_component_id: sourceComponent.source_component_id,
        center,
        layer: place.side === "back" ? "bottom" : "top",
        rotation: place.rotation,
        width: Math.max(width, 0.1),
        height: Math.max(height, 0.1),
        obstructs_within_bounds: true,
      }

      result.push(sourceComponent, pcbComponent)

      // Create ports for each pin in the image
      if (image.pins) {
        for (const pin of image.pins) {
          const port: SourcePort = {
            type: "source_port",
            source_port_id: `source_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pin.pin_number}`,
            pin_number: getNumericPinNumber(pin.pin_number),
            port_hints: [],
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
