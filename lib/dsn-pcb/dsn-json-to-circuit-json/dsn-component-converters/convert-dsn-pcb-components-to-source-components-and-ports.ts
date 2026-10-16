import type { AnySourceComponent, PcbPort, SourcePort } from "circuit-json"
import type { DsnPcb, Image, Pin } from "lib/dsn-pcb/types"
import { transformLocalPointToBoard } from "lib/utils/apply-placement-transform"
import { getPinOccurrenceSuffix } from "lib/utils/get-pin-occurrence-suffix"
import { type Matrix, applyToPoint } from "transformation-matrix"

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
        for (const [pinIndex, pin] of image.pins.entries()) {
          // Footprints may reuse a pin number (e.g. SOT-89 tab = pin 2);
          // disambiguate later occurrences so ids stay unique
          const occurrenceSuffix = getPinOccurrenceSuffix(image.pins, pinIndex)
          const port: SourcePort = {
            type: "source_port",
            source_port_id: `source_port_${component.name}-Pad${pin.pin_number}${occurrenceSuffix}_${place.refdes}`,
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pin.pin_number}`,
            // pin_number is only meaningful for numeric pin names; coercing a
            // non-numeric name ("A", "GND1", ...) with Number() produced NaN
            pin_number:
              typeof pin.pin_number === "number" ? pin.pin_number : undefined,
            port_hints: [],
          }
          // Pin offsets are footprint-local: apply the placement transform
          // (back-side mirroring + placement rotation) before translating
          const pcb_port_center = applyToPoint(
            transformDsnUnitToMm,
            transformLocalPointToBoard(place, pin),
          )
          const pcb_port: PcbPort = {
            pcb_port_id: `pcb_port_${component.name}-Pad${pin.pin_number}${occurrenceSuffix}_${place.refdes}`,
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
