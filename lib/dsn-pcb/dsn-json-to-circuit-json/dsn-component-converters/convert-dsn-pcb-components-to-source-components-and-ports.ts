import type {
  AnySourceComponent,
  PcbComponent,
  PcbPort,
  SourcePort,
} from "circuit-json"
import type { DsnPcb, Image } from "lib/dsn-pcb/types"
import { formatPinId } from "lib/utils/format-pin-id"
import { rotatePoint } from "lib/utils/rotate-point"
import { type Matrix, applyToPoint } from "transformation-matrix"

const resolveNumericPinNumber = (pinNumber: number | string): number => {
  if (typeof pinNumber === "number" && !Number.isNaN(pinNumber)) {
    return pinNumber
  }
  const parsed = Number.parseInt(String(pinNumber), 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

const getImageBoundsMm = (
  image: Image,
  transformDsnUnitToMm: Matrix,
): { width: number; height: number } => {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const outline of image.outlines) {
    const coordinates = outline.path?.coordinates ?? []
    for (let i = 0; i < coordinates.length; i += 2) {
      const point = applyToPoint(transformDsnUnitToMm, {
        x: coordinates[i]!,
        y: coordinates[i + 1]!,
      })
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    }
  }

  if (!Number.isFinite(minX)) {
    return { width: 1, height: 1 }
  }

  return {
    width: Math.max(maxX - minX, 0.1),
    height: Math.max(maxY - minY, 0.1),
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

  const imageMap = new Map(dsnPcb.library.images.map((img) => [img.name, img]))

  for (const component of dsnPcb.placement.components) {
    const image = imageMap.get(component.name)
    if (!image) continue

    component.places.forEach((place) => {
      const pcbComponentId = `${component.name}_${place.refdes}`
      const sourceComponentId = `sc_${pcbComponentId}`
      const placeRotation = place.rotation ?? 0
      const layer = place.side === "back" ? "bottom" : "top"

      const sourceComponent: AnySourceComponent = {
        type: "source_component",
        source_component_id: sourceComponentId,
        name: place.refdes,
        display_value: place.PN,
        ftype: "simple_chip",
      }
      result.push(sourceComponent)

      const center = applyToPoint(transformDsnUnitToMm, {
        x: place.x || 0,
        y: place.y || 0,
      })
      const bounds = getImageBoundsMm(image, transformDsnUnitToMm)

      const pcbComponent: PcbComponent = {
        type: "pcb_component",
        pcb_component_id: pcbComponentId,
        source_component_id: sourceComponentId,
        center,
        width: bounds.width,
        height: bounds.height,
        layer,
        rotation: placeRotation,
        obstructs_within_bounds: false,
      }
      result.push(pcbComponent)

      if (image.pins) {
        for (const pin of image.pins) {
          const pinId = formatPinId(pin.pin_number)
          const pinOffset = rotatePoint(
            pin.x,
            pin.y,
            (pin.rotation ?? 0) + placeRotation,
          )

          const port: SourcePort = {
            type: "source_port",
            source_port_id: `source_port_${component.name}-Pad${pinId}_${place.refdes}`,
            source_component_id: sourceComponentId,
            name: `${place.refdes}-${pin.pin_number}`,
            pin_number: resolveNumericPinNumber(pin.pin_number),
            port_hints: [String(pin.pin_number)],
          }

          const pcb_port_center = applyToPoint(transformDsnUnitToMm, {
            x: (place.x || 0) + pinOffset.x,
            y: (place.y || 0) + pinOffset.y,
          })

          const pcb_port: PcbPort = {
            pcb_port_id: `pcb_port_${component.name}-Pad${pinId}_${place.refdes}`,
            type: "pcb_port",
            source_port_id: port.source_port_id,
            pcb_component_id: pcbComponentId,
            x: pcb_port_center.x,
            y: pcb_port_center.y,
            layers: [layer],
          }
          result.push(port, pcb_port)
        }
      }
    })
  }

  return result
}
