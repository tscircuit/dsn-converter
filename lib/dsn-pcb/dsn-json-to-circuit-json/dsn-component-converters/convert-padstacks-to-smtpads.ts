import type { AnyCircuitElement, PcbSmtPad } from "circuit-json"
import Debug from "debug"
import type { DsnPcb } from "lib/dsn-pcb/types"
import { applyToPoint } from "transformation-matrix"

const debug = Debug("dsn-converter:convertPadstacksToSmtpads")

const rotatePoint = (x: number, y: number, rotationDeg = 0) => {
  const rotationRad = (rotationDeg * Math.PI) / 180
  return {
    x: x * Math.cos(rotationRad) - y * Math.sin(rotationRad),
    y: x * Math.sin(rotationRad) + y * Math.cos(rotationRad),
  }
}

const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360

const getSafeIdSegment = (value: number | string) =>
  String(value).replace(/[^a-zA-Z0-9_-]/g, "_")

const getCircuitLayer = (layer: string, side: string): "top" | "bottom" => {
  const normalizedLayer = layer.toLowerCase()
  if (normalizedLayer.includes("b.") || normalizedLayer.includes("bottom")) {
    return "bottom"
  }
  return side === "back" ? "bottom" : "top"
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

    placementComponent.places.forEach((place) => {
      debug("processing place...", { place })
      const { x: compX, y: compY, side } = place

      image.pins.forEach((pin, pinIndex) => {
        const pinLabel = String(pin.pin_number)
        const padId = `pcb_smtpad_${componentId}_${place.refdes}_${pinIndex}_${getSafeIdSegment(pinLabel)}`
        const pcbPortId = `pcb_port_${componentId}-Pad${pinLabel}_${place.refdes}`
        const pcbComponentId = `${componentId}_${place.refdes}`
        const padstack = padstacks.find((p) => p.name === pin.padstack_name)
        debug("found padstack", { padstack })

        if (!padstack) {
          console.warn(`No padstack found for pin: ${pin.padstack_name}`)
          return
        }

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
        let radius: number | undefined
        let padShape: PcbSmtPad["shape"] = "rect"
        let padRotation = normalizeRotation(
          place.rotation + (pin.rotation ?? 0),
        )

        if (rectShape) {
          const [x1, y1, x2, y2] = rectShape.coordinates
          width = Math.abs(x2 - x1) * transform.a
          height = Math.abs(y2 - y1) * transform.a
          if (padRotation !== 0) {
            padShape = "rotated_rect"
          }
        } else if (polygonShape) {
          const coordinates = polygonShape.coordinates
          let minX = Infinity
          let maxX = -Infinity
          let minY = Infinity
          let maxY = -Infinity

          for (let i = 0; i < coordinates.length; i += 2) {
            const x = coordinates[i]
            const y = coordinates[i + 1]
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
          }

          width = Math.abs(maxX - minX) * transform.a
          height = Math.abs(maxY - minY) * transform.a
          if (padRotation !== 0) {
            padShape = "rotated_rect"
          }
        } else if (pathShape) {
          const [x1, y1, x2, y2] = pathShape.coordinates
          const pathLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
          const pathAngle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
          width = (pathLength + pathShape.width) * transform.a
          height = pathShape.width * transform.a
          radius = height / 2
          padRotation = normalizeRotation(padRotation + pathAngle)
          padShape = padRotation === 0 ? "pill" : "rotated_pill"
        } else if (circleShape) {
          radius = (circleShape.diameter / 2) * transform.a
          width = radius
          height = radius
          padShape = "circle"
        } else {
          console.warn(`No valid shape found for padstack: ${padstack.name}`)
          return
        }

        const rotatedPin = rotatePoint(pin.x, pin.y, place.rotation)
        const { x: circuitX, y: circuitY } = applyToPoint(transform, {
          x: (compX || 0) + rotatedPin.x,
          y: (compY || 0) + rotatedPin.y,
        })
        const layer = getCircuitLayer(padstack.shapes[0].layer, side)

        debug("determining layer with padstack shapes", {
          shapes: padstack.shapes,
          layer,
        })

        const commonPadProps = {
          type: "pcb_smtpad" as const,
          pcb_smtpad_id: padId,
          pcb_component_id: pcbComponentId,
          pcb_port_id: pcbPortId,
          x: circuitX,
          y: circuitY,
          layer,
          port_hints: [pinLabel],
        }

        let pcbPad: PcbSmtPad
        if (padShape === "circle") {
          pcbPad = {
            ...commonPadProps,
            shape: "circle",
            radius: radius!,
          }
        } else if (padShape === "rotated_rect") {
          pcbPad = {
            ...commonPadProps,
            shape: "rotated_rect",
            width,
            height,
            ccw_rotation: padRotation,
          }
        } else if (padShape === "pill") {
          pcbPad = {
            ...commonPadProps,
            shape: "pill",
            width,
            height,
            radius: radius!,
          }
        } else if (padShape === "rotated_pill") {
          pcbPad = {
            ...commonPadProps,
            shape: "rotated_pill",
            width,
            height,
            radius: radius!,
            ccw_rotation: padRotation,
          }
        } else {
          pcbPad = {
            ...commonPadProps,
            shape: "rect",
            width,
            height,
          }
        }

        elements.push(pcbPad)
      })
    })
  })
  return elements
}
