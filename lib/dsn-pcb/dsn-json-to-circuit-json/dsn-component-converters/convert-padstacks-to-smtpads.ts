import type { AnyCircuitElement, PcbSmtPad } from "circuit-json"
import Debug from "debug"
import type { DsnPcb } from "lib/dsn-pcb/types"
import { applyToPoint } from "transformation-matrix"

const debug = Debug("dsn-converter:convertPadstacksToSmtpads")

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

      const rotationDeg = place.rotation ?? 0
      const rotationRad = (rotationDeg * Math.PI) / 180

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

        let width: number | undefined
        let height: number | undefined
        let radius: number | undefined
        let points: Array<{ x: number; y: number }> | undefined
        let shape: "rect" | "rotated_rect" | "circle" | "polygon" | "pill" | "rotated_pill" = "rect"

        if (rectShape) {
          const [x1, y1, x2, y2] = rectShape.coordinates
          width = Math.abs(x2 - x1) * transform.a
          height = Math.abs(y2 - y1) * transform.a
          shape = rotationDeg === 0 ? "rect" : "rotated_rect"
        } else if (polygonShape) {
          const coordinates = polygonShape.coordinates
          points = []
          for (let i = 0; i < coordinates.length; i += 2) {
            points.push({
              x: coordinates[i] * transform.a,
              y: coordinates[i + 1] * transform.a,
            })
          }
          shape = "polygon"
        } else if (pathShape) {
          const [x1, y1, x2, y2] = pathShape.coordinates
          width = pathShape.width * transform.a
          height = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * transform.a
          radius = width / 2
          shape = rotationDeg === 0 ? "pill" : "rotated_pill"
        } else if (circleShape) {
          radius = (circleShape.diameter / 2) * transform.a
          shape = "circle"
        } else {
          console.warn(`No valid shape found for padstack: ${padstack.name}`)
          return
        }

        // Apply component rotation to pin offset before translating
        const rotatedPinX =
          pin.x * Math.cos(rotationRad) - pin.y * Math.sin(rotationRad)
        const rotatedPinY =
          pin.x * Math.sin(rotationRad) + pin.y * Math.cos(rotationRad)

        const { x: circuitX, y: circuitY } = applyToPoint(transform, {
          x: (compX || 0) + rotatedPinX,
          y: (compY || 0) + rotatedPinY,
        })

        const layer: "top" | "bottom" = padstack.shapes[0].layer.includes("B.")
          ? "bottom"
          : "top"

        const commonPadProps = {
          type: "pcb_smtpad" as const,
          pcb_smtpad_id: `pcb_smtpad_${componentId}_${place.refdes}_${Number(pin.pin_number) - 1}`,
          pcb_component_id: `${componentId}_${place.refdes}`,
          pcb_port_id: `pcb_port_${componentId}-Pad${pin.pin_number}_${place.refdes}`,
          x: circuitX,
          y: circuitY,
          layer,
          port_hints: [pin.pin_number.toString()],
        }

        let pcbPad: PcbSmtPad
        if (shape === "rect") {
          pcbPad = {
            ...commonPadProps,
            shape: "rect",
            width: width!,
            height: height!,
          }
        } else if (shape === "rotated_rect") {
          pcbPad = {
            ...commonPadProps,
            shape: "rotated_rect",
            width: width!,
            height: height!,
            ccw_rotation: rotationDeg,
          }
        } else if (shape === "circle") {
          pcbPad = {
            ...commonPadProps,
            shape: "circle",
            radius: radius!,
          }
        } else if (shape === "polygon") {
          pcbPad = {
            ...commonPadProps,
            shape: "polygon",
            points: points!,
          }
        } else if (shape === "pill") {
          pcbPad = {
            ...commonPadProps,
            shape: "pill",
            width: width!,
            height: height!,
            radius: radius!,
          }
        } else {
          pcbPad = {
            ...commonPadProps,
            shape: "rotated_pill",
            width: width!,
            height: height!,
            radius: radius!,
            ccw_rotation: rotationDeg,
          }
        }

        elements.push(pcbPad)
      })
    })
  })
  return elements
}
