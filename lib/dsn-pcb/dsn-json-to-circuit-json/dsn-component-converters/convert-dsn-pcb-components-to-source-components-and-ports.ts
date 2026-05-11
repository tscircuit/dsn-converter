import type {
  AnyCircuitElement,
  AnySourceComponent,
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
}): AnyCircuitElement[] => {
  const result: AnyCircuitElement[] = []

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
      result.push(sourceComponent)

      const bounds = getImageBounds(image)
      const placeX = place.x || 0
      const placeY = place.y || 0
      const pcbComponentCenter = applyToPoint(transformDsnUnitToMm, {
        x: placeX + bounds.centerX,
        y: placeY + bounds.centerY,
      })
      result.push({
        type: "pcb_component",
        pcb_component_id: pcbComponentId,
        source_component_id: sourceComponent.source_component_id,
        center: pcbComponentCenter,
        width: bounds.width * transformDsnUnitToMm.a,
        height: bounds.height * transformDsnUnitToMm.a,
        layer: place.side === "back" ? "bottom" : "top",
        rotation: place.rotation ?? 0,
      } as AnyCircuitElement)

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

function getImageBounds(image: Image): {
  centerX: number
  centerY: number
  width: number
  height: number
} {
  const xs: number[] = []
  const ys: number[] = []

  for (const outline of image.outlines ?? []) {
    const coordinates = outline.path?.coordinates ?? []
    for (let i = 0; i < coordinates.length; i += 2) {
      const x = coordinates[i]
      const y = coordinates[i + 1]
      if (Number.isFinite(x) && Number.isFinite(y)) {
        xs.push(x!)
        ys.push(y!)
      }
    }
  }

  for (const pin of image.pins ?? []) {
    if (Number.isFinite(pin.x) && Number.isFinite(pin.y)) {
      xs.push(pin.x)
      ys.push(pin.y)
    }
  }

  if (xs.length === 0 || ys.length === 0) {
    return { centerX: 0, centerY: 0, width: 1000, height: 1000 }
  }

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: Math.max(maxX - minX, 1000),
    height: Math.max(maxY - minY, 1000),
  }
}
