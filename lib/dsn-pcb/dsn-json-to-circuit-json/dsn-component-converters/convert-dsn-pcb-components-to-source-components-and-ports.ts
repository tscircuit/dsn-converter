import type {
  AnySourceComponent,
  PcbComponent,
  PcbPort,
  SourcePort,
} from "circuit-json"
import type { DsnPcb, Image, Pin } from "lib/dsn-pcb/types"
import { applyPlaceRotation } from "lib/utils/apply-place-rotation"
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
      const sourceComponent: AnySourceComponent = {
        type: "source_component",
        source_component_id: `sc_${component.name}_${place.refdes}`,
        name: place.refdes,
        display_value: place.PN,
        // Default to simple_chip if no specific type can be determined
        ftype: "simple_chip",
      }
      result.push(sourceComponent)

      // Footprint names repeat across placements, so the refdes is what makes
      // the pcb_component id unique.
      const pcbComponentId = `pcb_component_${component.name}_${place.refdes}`
      const placeCenter = applyToPoint(transformDsnUnitToMm, {
        x: place.x || 0,
        y: place.y || 0,
      })
      const rotation = (((place.rotation ?? 0) % 360) + 360) % 360

      const pinPositions = (image.pins ?? []).map((pin) => {
        const offset = applyPlaceRotation(
          { x: pin.x, y: pin.y },
          place.rotation,
          place.side,
        )
        return applyToPoint(transformDsnUnitToMm, {
          x: (place.x || 0) + offset.x,
          y: (place.y || 0) + offset.y,
        })
      })
      const width = pinPositions.length
        ? Math.max(...pinPositions.map((p) => p.x)) -
          Math.min(...pinPositions.map((p) => p.x))
        : 0
      const height = pinPositions.length
        ? Math.max(...pinPositions.map((p) => p.y)) -
          Math.min(...pinPositions.map((p) => p.y))
        : 0

      const pcbComponent: PcbComponent = {
        type: "pcb_component",
        pcb_component_id: pcbComponentId,
        source_component_id: sourceComponent.source_component_id,
        center: placeCenter,
        width,
        height,
        rotation,
        layer: place.side === "back" ? "bottom" : "top",
        obstructs_within_bounds: false,
      }
      result.push(pcbComponent)

      // Create ports for each pin in the image
      if (image.pins) {
        for (const pin of image.pins) {
          const port: SourcePort = {
            type: "source_port",
            source_port_id: `source_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pin.pin_number}`,
            pin_number: Number(pin.pin_number),
            port_hints: [],
          }
          // Handle case where place coordinates might be null/undefined
          const placeX = place.x || 0
          const placeY = place.y || 0
          const rotatedPinOffset = applyPlaceRotation(
            { x: pin.x, y: pin.y },
            place.rotation,
            place.side,
          )
          const pcb_port_center = applyToPoint(transformDsnUnitToMm, {
            x: placeX + rotatedPinOffset.x,
            y: placeY + rotatedPinOffset.y,
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
