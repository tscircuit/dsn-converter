import type {
  AnySourceComponent,
  PcbComponent,
  PcbPort,
  SourcePort,
} from "circuit-json"
import type { DsnPcb } from "lib/dsn-pcb/types"
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
  const imageMap = new Map(dsnPcb.library.images.map((img) => [img.name, img]))

  for (const component of dsnPcb.placement.components) {
    const image = imageMap.get(component.name)
    if (!image) continue

    component.places.forEach((place) => {
      // IDs kept exactly as original to preserve compatibility
      const sourceComponent: AnySourceComponent = {
        type: "source_component",
        source_component_id: `sc_${component.name}_${place.refdes}`,
        name: place.refdes,
        display_value: place.PN,
        ftype: "simple_chip",
      }

      // NEW: add pcb_component (was missing before)
      const pcbComponent: PcbComponent = {
        type: "pcb_component",
        pcb_component_id: `pcb_component_${place.refdes}`,
        source_component_id: sourceComponent.source_component_id,
        center: applyToPoint(transformDsnUnitToMm, {
          x: place.x || 0,
          y: place.y || 0,
        }),
        layer: place.side === "back" ? "bottom" : "top",
        rotation: place.rotation || 0,
        width: 0,
        height: 0,
        obstructs_within_bounds: false,
      }

      result.push(sourceComponent, pcbComponent)

      if (image.pins) {
        for (const pin of image.pins) {
          const port: SourcePort = {
            type: "source_port",
            // original format preserved
            source_port_id: `source_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pin.pin_number}`,
            pin_number: Number(pin.pin_number),
            port_hints: [],
          }
          const placeX = place.x || 0
          const placeY = place.y || 0
          const pcb_port_center = applyToPoint(transformDsnUnitToMm, {
            x: placeX + pin.x,
            y: placeY + pin.y,
          })
          const pcb_port: PcbPort = {
            // original format preserved
            pcb_port_id: `pcb_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            type: "pcb_port",
            source_port_id: port.source_port_id,
            pcb_component_id: `pcb_component_${place.refdes}`,
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
