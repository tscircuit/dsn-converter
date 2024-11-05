import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "../types"
import { applyToPoint } from "transformation-matrix"

export function convertPadstacksToSmtPads(
  pcb: DsnPcb,
  transform: any,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []
  const { padstacks, images } = pcb.library

  images.forEach((image) => {
    const componentId = image.name
    const placementComponent = pcb.placement.components.find(
      (comp) => comp.name === componentId,
    )

    if (!placementComponent) {
      console.warn(`No placement component found for image: ${componentId}`)
      return
    }

    // Get component placement
    const { x: compX, y: compY, side } = placementComponent.place

    image.pins.forEach((pin) => {
      // Find the corresponding padstack
      const padstack = padstacks.find((p) => p.name === pin.padstack_name)

      if (!padstack) {
        console.warn(`No padstack found for pin: ${pin.padstack_name}`)
        return
      }

      // Get the rect shape from the padstack
      const rectShape = padstack.shapes.find(
        (shape) => shape.shapeType === "rect",
      )

      if (!rectShape) {
        console.warn(`No rect shape found for padstack: ${padstack.name}`)
        return
      }

      // Extract the width and height from the rect shape coordinates
      const [x1, y1, x2, y2] = rectShape.coordinates
      const width = Math.abs(x2 - x1) / 1000 // Convert μm to mm
      const height = Math.abs(y2 - y1) / 1000 // Convert μm to mm

      // Calculate position in circuit space using the transformation matrix
      const { x: circuitX, y: circuitY } = applyToPoint(transform, {
        x: compX + pin.x,
        y: compY + pin.y,
      })

      const pcbPad: AnyCircuitElement = {
        type: "pcb_smtpad",
        pcb_smtpad_id: `${pin.padstack_name}_${pin.pin_number}`,
        pcb_component_id: componentId,
        pcb_port_id: `${pin.padstack_name}_${pin.pin_number}`,
        shape: "rect",
        x: circuitX,
        y: circuitY,
        width,
        height,
        layer: side === "front" ? "top" : "bottom",
        port_hints: [pin.pin_number.toString()],
      }

      elements.push(pcbPad)
    })
  })

  return elements
}
