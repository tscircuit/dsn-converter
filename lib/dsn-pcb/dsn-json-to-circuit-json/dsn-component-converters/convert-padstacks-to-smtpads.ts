import type { AnyCircuitElement, PcbSmtPad } from "circuit-json"
import Debug from "debug"
import type { DsnPcb } from "lib/dsn-pcb/types"
import { applyToPoint } from "transformation-matrix"

const debug = Debug("dsn-converter:convertPadstacksToSmtpads")

/**
 * Rotate a point (x, y) around the origin by the given angle in degrees.
 */
function rotatePoint(
  x: number,
  y: number,
  angleDeg: number,
): { x: number; y: number } {
  if (!angleDeg) return { x, y }
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  }
}

/**
 * Get a safe string index for a pin_number that may be non-numeric (e.g. "GND2", "A", "C").
 */
function getPinIndex(pinNumber: number | string, pinIdx: number): string {
  const num = Number(pinNumber)
  if (!Number.isNaN(num)) return String(num - 1)
  return String(pinIdx)
}

export function convertPadstacksToSmtPads(
  pcb: DsnPcb,
  transform: any,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []
  const { padstacks, images } = pcb.library

  debug("processing padstacks...")
  images.forEach((image) => {
    const componentId = image.name
    const placementComponent = pcb.placement.components.find(
      (comp) => comp.name === componentId,
    )

    if (!placementComponent) {
      console.warn(`No placement component found for image: ${componentId}`)
      return
    }

    // Handle each placement for this component
    placementComponent.places.forEach((place) => {
      debug("processing place...", { place })
      const { x: compX, y: compY, side } = place
      const placeRotation = place.rotation || 0

      image.pins.forEach((pin, pinIdx) => {
        // Find the corresponding padstack
        const padstack = padstacks.find((p) => p.name === pin.padstack_name)
        debug("found padstack", { padstack })

        if (!padstack) {
          console.warn(`No padstack found for pin: ${pin.padstack_name}`)
          return
        }

        // Find shape in padstack - try rectangle first, then polygon
        const rectShape = padstack.shapes.find(
          (shape) => shape.shapeType === "rect",
        )

        const polygonShape = padstack.shapes.find(
          (shape) => shape.shapeType === "polygon",
        )

        const circleShape = padstack.shapes.find(
          (shape) => shape.shapeType === "circle",
        )

        const pathShape = padstack.shapes.find(
          (shape) => shape.shapeType === "path",
        )

        debug("found shapes", {
          rectShape,
          polygonShape,
          circleShape,
          pathShape,
        })

        let width: number
        let height: number

        if (rectShape) {
          // Handle rectangle shape
          const [x1, y1, x2, y2] = rectShape.coordinates
          width = Math.abs(x2 - x1) / 1000 // Convert μm to mm
          height = Math.abs(y2 - y1) / 1000 // Convert μm to mm
        } else if (polygonShape) {
          // Handle polygon shape
          const coordinates = polygonShape.coordinates
          let minX = Infinity
          let maxX = -Infinity
          let minY = Infinity
          let maxY = -Infinity

          // Coordinates are in pairs (x,y), so iterate by 2
          for (let i = 0; i < coordinates.length; i += 2) {
            const x = coordinates[i]
            const y = coordinates[i + 1]

            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
          }

          width = Math.abs(maxX - minX) / 1000
          height = Math.abs(maxY - minY) / 1000
        } else if (pathShape) {
          // For path shapes (oval/pill pads), width is the path width
          // and height is the distance between path endpoints
          const [x1, y1, x2, y2] = pathShape.coordinates
          width = pathShape.width / 1000 // Convert μm to mm
          height = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 1000
        } else if (circleShape) {
          // Handle circle shape
          const radius = circleShape.diameter / 2 / 1000
          width = radius
          height = radius
        } else {
          console.warn(`No valid shape found for padstack: ${padstack.name}`)
          return
        }

        // Apply component rotation to pin offset before adding to component position
        const rotatedPin = rotatePoint(pin.x, pin.y, placeRotation)

        // Calculate position in circuit space using the transformation matrix
        // Convert component position and pin offset to circuit coordinates
        const { x: circuitX, y: circuitY } = applyToPoint(transform, {
          x: (compX || 0) + rotatedPin.x,
          y: (compY || 0) + rotatedPin.y,
        })

        let pcbPad: PcbSmtPad
        const padIndex = getPinIndex(pin.pin_number, pinIdx)
        if (rectShape || polygonShape || pathShape) {
          const layer = padstack.shapes[0].layer.includes("B.")
            ? "bottom"
            : "top"
          debug("determining layer with padstack shapes", {
            shapes: padstack.shapes,
            layer,
          })
          pcbPad = {
            type: "pcb_smtpad",
            pcb_smtpad_id: `pcb_smtpad_${componentId}_${place.refdes}_${padIndex}`,
            pcb_component_id: `${componentId}_${place.refdes}`,
            pcb_port_id: `pcb_port_${componentId}-Pad${pin.pin_number}_${place.refdes}`,
            shape: "rect",
            x: circuitX,
            y: circuitY,
            width,
            height,
            layer,
            port_hints: [pin.pin_number.toString()],
          }
        } else {
          pcbPad = {
            type: "pcb_smtpad",
            pcb_smtpad_id: `pcb_smtpad_${componentId}_${place.refdes}_${padIndex}`,
            pcb_component_id: `${componentId}_${place.refdes}`,
            pcb_port_id: `pcb_port_${componentId}-Pad${pin.pin_number}_${place.refdes}`,
            shape: "circle",
            x: circuitX,
            y: circuitY,
            radius: circleShape!.diameter / 2 / 1000,
            layer: side === "front" ? "top" : "bottom",
            port_hints: [pin.pin_number.toString()],
          }
        }

        elements.push(pcbPad)
      })
    })
  })
  return elements
}
