import type { AnyCircuitElement, PcbSmtPad } from "circuit-json"
import Debug from "debug"
import type { DsnPcb, Shape } from "lib/dsn-pcb/types"
import { applyToPoint } from "transformation-matrix"

const debug = Debug("dsn-converter:convertPadstacksToSmtpads")

function getShapeBounds(shape: Shape): {
  width: number
  height: number
  centerX: number
  centerY: number
} {
  if (shape.shapeType === "rect") {
    const [x1, y1, x2, y2] = shape.coordinates
    return {
      width: Math.abs(x2 - x1) / 1000,
      height: Math.abs(y2 - y1) / 1000,
      centerX: (x1 + x2) / 2,
      centerY: (y1 + y2) / 2,
    }
  }

  if (shape.shapeType === "polygon") {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < shape.coordinates.length; i += 2) {
      const x = shape.coordinates[i]
      const y = shape.coordinates[i + 1]

      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }

    return {
      width: Math.abs(maxX - minX) / 1000,
      height: Math.abs(maxY - minY) / 1000,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    }
  }

  if (shape.shapeType === "path") {
    const [x1, y1, x2, y2] = shape.coordinates
    return {
      width: shape.width / 1000,
      height: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 1000,
      centerX: (x1 + x2) / 2,
      centerY: (y1 + y2) / 2,
    }
  }

  const radius = shape.diameter / 2 / 1000
  return {
    width: radius,
    height: radius,
    centerX: shape.x ?? 0,
    centerY: shape.y ?? 0,
  }
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

      image.pins.forEach((pin) => {
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

        const selectedShape =
          rectShape ?? polygonShape ?? pathShape ?? circleShape
        if (!selectedShape) {
          console.warn(`No valid shape found for padstack: ${padstack.name}`)
          return
        }

        const { width, height, centerX, centerY } =
          getShapeBounds(selectedShape)

        // Calculate position in circuit space using the transformation matrix
        // Convert component position and pin offset to circuit coordinates
        const { x: circuitX, y: circuitY } = applyToPoint(transform, {
          x: (compX || 0) + pin.x + centerX,
          y: (compY || 0) + pin.y + centerY,
        })

        let pcbPad: PcbSmtPad
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
            pcb_smtpad_id: `pcb_smtpad_${componentId}_${place.refdes}_${Number(pin.pin_number) - 1}`,
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
            pcb_smtpad_id: `pcb_smtpad_${componentId}_${place.refdes}_${Number(pin.pin_number) - 1}`,
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
