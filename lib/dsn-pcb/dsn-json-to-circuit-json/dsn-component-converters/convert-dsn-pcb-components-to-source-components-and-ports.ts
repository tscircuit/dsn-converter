import type {
  AnySourceComponent,
  PcbComponent,
  PcbPort,
  SourcePort,
} from "circuit-json"
import type { DsnPcb, Image, Pin } from "lib/dsn-pcb/types"
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

    const pinBounding =
      image.pins && image.pins.length > 0
        ? image.pins.reduce(
            (acc, pin) => ({
              minX: Math.min(acc.minX, pin.x),
              maxX: Math.max(acc.maxX, pin.x),
              minY: Math.min(acc.minY, pin.y),
              maxY: Math.max(acc.maxY, pin.y),
            }),
            {
              minX: Number.POSITIVE_INFINITY,
              maxX: Number.NEGATIVE_INFINITY,
              minY: Number.POSITIVE_INFINITY,
              maxY: Number.NEGATIVE_INFINITY,
            },
          )
        : undefined

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

      // Handle case where place coordinates might be null/undefined
      const placeX = place.x || 0
      const placeY = place.y || 0
      const placeCenter = applyToPoint(transformDsnUnitToMm, {
        x: placeX,
        y: placeY,
      })

      // Emit pcb_component so consumers (and the reverse
      // convertCircuitJsonToDsnJson) don't crash on missing pcb components
      const pcbComponent: PcbComponent = {
        type: "pcb_component",
        pcb_component_id: `${component.name}_${place.refdes}`,
        source_component_id: sourceComponent.source_component_id,
        center: placeCenter,
        rotation: place.rotation || 0,
        layer: place.side === "back" ? "bottom" : "top",
        obstructs_within_bounds: false,
        width: pinBounding
          ? (pinBounding.maxX - pinBounding.minX) * transformDsnUnitToMm.a
          : 0,
        height: pinBounding
          ? (pinBounding.maxY - pinBounding.minY) * transformDsnUnitToMm.a
          : 0,
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
            // Expose the pad number as a port hint so consumers (and the
            // reverse convertCircuitJsonToDsnJson) can resolve pad numbering
            port_hints: [String(pin.pin_number)],
          }
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
