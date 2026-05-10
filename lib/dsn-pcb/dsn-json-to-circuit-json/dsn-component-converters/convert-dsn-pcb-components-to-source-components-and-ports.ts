import type {
  AnySourceComponent,
  PcbPort,
  SourcePort,
  PcbComponent,
  PcbSilkscreenPath,
} from "circuit-json"
import type { DsnPcb, Image, Pin } from "lib/dsn-pcb/types"
import {
  type Matrix,
  applyToPoint,
  compose,
  translate,
  rotateDeg,
} from "transformation-matrix"

export const convertDsnPcbComponentsToSourceComponentsAndPorts = ({
  dsnPcb,
  transformDsnUnitToMm,
}: {
  dsnPcb: DsnPcb
  transformDsnUnitToMm: Matrix
}): Array<
  AnySourceComponent | SourcePort | PcbPort | PcbComponent | PcbSilkscreenPath
> => {
  const result: Array<
    AnySourceComponent | SourcePort | PcbPort | PcbComponent | PcbSilkscreenPath
  > = []

  // Map to store image definitions for component lookup
  const imageMap = new Map(dsnPcb.library.images.map((img) => [img.name, img]))

  for (const component of dsnPcb.placement.components) {
    const image = imageMap.get(component.name)
    if (!image) continue

    // Create source component for each place
    component.places.forEach((place) => {
      const source_component_id = `sc_${component.name}_${place.refdes}`
      const pcb_component_id = `pcb_component_${component.name}_${place.refdes}`

      const sourceComponent: AnySourceComponent = {
        type: "source_component",
        source_component_id,
        name: place.refdes,
        display_value: place.PN,
        // Default to simple_chip if no specific type can be determined
        ftype: "simple_chip",
      }
      result.push(sourceComponent)

      const pcbComponent: PcbComponent = {
        type: "pcb_component",
        pcb_component_id,
        source_component_id,
        center: applyToPoint(transformDsnUnitToMm, {
          x: place.x || 0,
          y: place.y || 0,
        }),
        rotation: place.rotation || 0,
        layer: place.side === "back" ? "bottom" : "top",
      }
      result.push(pcbComponent)

      // Create silkscreen from image outlines
      if (image.outlines) {
        image.outlines.forEach((outline, outlineIdx) => {
          if (outline.path) {
            const { coordinates, width } = outline.path
            const route: { x: number; y: number }[] = []

            // Apply rotation and translation to each point in the outline
            const outlineTransform = compose(
              translate(place.x || 0, place.y || 0),
              rotateDeg(place.rotation || 0),
            )
            const fullTransform = compose(
              transformDsnUnitToMm,
              outlineTransform,
            )

            for (let i = 0; i < coordinates.length; i += 2) {
              route.push(
                applyToPoint(fullTransform, {
                  x: coordinates[i],
                  y: coordinates[i + 1],
                }),
              )
            }

            const silkscreenPath: PcbSilkscreenPath = {
              type: "pcb_silkscreen_path",
              pcb_silkscreen_path_id: `pcb_silkscreen_${component.name}_${place.refdes}_${outlineIdx}`,
              pcb_component_id,
              layer: place.side === "back" ? "bottom" : "top",
              route,
              stroke_width: (width || 100) / 1000,
            }
            result.push(silkscreenPath)
          }
        })
      }

      // Create ports for each pin in the image
      if (image.pins) {
        for (const pin of image.pins) {
          const pinNumberStr = pin.pin_number.toString()
          const pinNumber = Number.parseInt(pinNumberStr, 10)

          const port: SourcePort = {
            type: "source_port",
            source_port_id: `source_port_${component.name}-Pad${pin.pin_number}_${place.refdes}`,
            source_component_id: sourceComponent.source_component_id,
            name: `${place.refdes}-${pin.pin_number}`,
            pin_number: Number.isNaN(pinNumber) ? undefined : pinNumber,
            port_hints: [pinNumberStr],
          }
          // Handle case where place coordinates might be null/undefined
          const placeX = place.x || 0
          const placeY = place.y || 0

          // Apply rotation
          const pinTransform = compose(
            translate(placeX, placeY),
            rotateDeg(place.rotation || 0),
          )

          const pcb_port_center = applyToPoint(
            compose(transformDsnUnitToMm, pinTransform),
            { x: pin.x, y: pin.y },
          )
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
