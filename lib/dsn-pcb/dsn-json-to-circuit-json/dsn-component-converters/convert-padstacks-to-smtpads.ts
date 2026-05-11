import type { AnyCircuitElement, PcbPlatedHole, PcbSmtPad } from "circuit-json"
import Debug from "debug"
import type { CircleShape, DsnPcb, PathShape } from "lib/dsn-pcb/types"
import { applyToPoint } from "transformation-matrix"

const debug = Debug("dsn-converter:convertPadstacksToSmtpads")

type PlatedHoleShape =
  | {
      shape: "circle"
      outer_diameter: number
      hole_diameter: number
    }
  | {
      shape: "pill"
      outer_width: number
      outer_height: number
      hole_width: number
      hole_height: number
    }

function getSafeIdSegment(value: number | string): string {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "_")
}

function getPathOuterDimensions(pathShape: PathShape): {
  width: number
  height: number
} | null {
  const [x1, y1, x2, y2] = pathShape.coordinates
  if (
    typeof x1 !== "number" ||
    typeof y1 !== "number" ||
    typeof x2 !== "number" ||
    typeof y2 !== "number"
  ) {
    return null
  }

  return {
    width: (Math.abs(x2 - x1) + pathShape.width) / 1000,
    height: (Math.abs(y2 - y1) + pathShape.width) / 1000,
  }
}

function getPlatedHoleShape(
  padstackName: string,
  circleShape?: CircleShape,
  pathShape?: PathShape,
): PlatedHoleShape | null {
  const roundMatch = padstackName.match(
    /^Round\[A\]Pad_(\d+(?:\.\d+)?)_(\d+(?:\.\d+)?)_um$/,
  )
  if (roundMatch && circleShape) {
    const holeDiameter = Number(roundMatch[1]) / 1000
    const outerDiameter = Number(roundMatch[2]) / 1000
    if (holeDiameter > 0 && outerDiameter > holeDiameter) {
      return {
        shape: "circle",
        outer_diameter: outerDiameter,
        hole_diameter: holeDiameter,
      }
    }
  }

  const ovalMatch = padstackName.match(
    /^Oval\[A\]Pad_(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)_um$/,
  )
  if (ovalMatch && pathShape) {
    const holeWidth = Number(ovalMatch[1]) / 1000
    const holeHeight = Number(ovalMatch[2]) / 1000
    const outer = getPathOuterDimensions(pathShape)
    if (
      outer &&
      holeWidth > 0 &&
      holeHeight > 0 &&
      outer.width > holeWidth &&
      outer.height > holeHeight
    ) {
      return {
        shape: "pill",
        outer_width: outer.width,
        outer_height: outer.height,
        hole_width: holeWidth,
        hole_height: holeHeight,
      }
    }
  }

  return null
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

        // Calculate position in circuit space using the transformation matrix
        // Convert component position and pin offset to circuit coordinates
        const { x: circuitX, y: circuitY } = applyToPoint(transform, {
          x: (compX || 0) + pin.x,
          y: (compY || 0) + pin.y,
        })

        const pcbPortId = `pcb_port_${componentId}-Pad${pin.pin_number}_${place.refdes}`
        const pcbComponentId = `${componentId}_${place.refdes}`
        const platedHoleShape = getPlatedHoleShape(
          padstack.name,
          circleShape as CircleShape | undefined,
          pathShape as PathShape | undefined,
        )

        if (platedHoleShape) {
          const pcbPlatedHole: PcbPlatedHole = {
            type: "pcb_plated_hole",
            pcb_plated_hole_id: `pcb_plated_hole_${componentId}_${place.refdes}_${getSafeIdSegment(pin.pin_number)}`,
            pcb_component_id: pcbComponentId,
            pcb_port_id: pcbPortId,
            x: circuitX,
            y: circuitY,
            layers: ["top", "bottom"],
            port_hints: [pin.pin_number.toString()],
            ...platedHoleShape,
          } as PcbPlatedHole
          elements.push(pcbPlatedHole)
          return
        }

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
            pcb_component_id: pcbComponentId,
            pcb_port_id: pcbPortId,
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
            pcb_component_id: pcbComponentId,
            pcb_port_id: pcbPortId,
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
