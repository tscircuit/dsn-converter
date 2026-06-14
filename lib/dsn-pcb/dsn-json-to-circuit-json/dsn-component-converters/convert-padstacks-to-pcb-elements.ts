import type { AnyCircuitElement, PcbPlatedHole, PcbSmtPad } from "circuit-json"
import Debug from "debug"
import type { DsnPcb, Padstack } from "lib/dsn-pcb/types"
import { applyToPoint } from "transformation-matrix"
import type { Matrix } from "transformation-matrix"

const debug = Debug("dsn-converter:convertPadstacksToPcbElements")

function getRectSmtPadDimensions(padstack: Padstack): {
  width: number
  height: number
  layer: PcbSmtPad["layer"]
} | null {
  const rectShape = padstack.shapes.find((s) => s.shapeType === "rect")
  const polygonShape = padstack.shapes.find((s) => s.shapeType === "polygon")
  const pathShape = padstack.shapes.find((s) => s.shapeType === "path")

  if (rectShape) {
    const [x1, y1, x2, y2] = rectShape.coordinates
    return {
      width: Math.abs(x2 - x1) / 1000,
      height: Math.abs(y2 - y1) / 1000,
      layer: padstack.shapes[0].layer.includes("B.") ? "bottom" : "top",
    }
  }

  if (polygonShape) {
    const coords = polygonShape.coordinates
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (let i = 0; i < coords.length; i += 2) {
      minX = Math.min(minX, coords[i])
      maxX = Math.max(maxX, coords[i])
      minY = Math.min(minY, coords[i + 1])
      maxY = Math.max(maxY, coords[i + 1])
    }
    return {
      width: Math.abs(maxX - minX) / 1000,
      height: Math.abs(maxY - minY) / 1000,
      layer: padstack.shapes[0].layer.includes("B.") ? "bottom" : "top",
    }
  }

  if (pathShape) {
    const [x1, y1, x2, y2] = pathShape.coordinates
    return {
      width: pathShape.width / 1000,
      height: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 1000,
      layer: padstack.shapes[0].layer.includes("B.") ? "bottom" : "top",
    }
  }

  return null
}

function isThruHolePadstack(padstack: Padstack): boolean {
  return (
    padstack.shapes.some((s) => s.shapeType === "circle") &&
    padstack.shapes.some((s) => s.layer?.includes("F.")) &&
    padstack.shapes.some((s) => s.layer?.includes("B."))
  )
}

function getHoleDiameterFromPadstackName(
  padstackName: string,
  outerDiameter: number,
): number {
  // Internal format: "Round[A]Pad_{holeDiameter}_{outerDiameter}_um"
  // KiCad export format: "Round[A]Pad_{outerDiameter}_um" (drill not encoded)
  const numbers = padstackName
    .match(/[\d.]+(?:e[+-]?\d+)?/g)
    ?.map(Number)
    .filter((n) => !Number.isNaN(n))

  return numbers && numbers.length >= 2
    ? numbers[0] / 1000
    : outerDiameter * 0.5
}

export function convertPadstacksToPcbElements(
  dsnPcb: DsnPcb,
  dsnUnitToMmTransform: Matrix,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []
  const { padstacks, images } = dsnPcb.library

  for (const image of images) {
    const imageName = image.name
    const placementComponent = dsnPcb.placement.components.find(
      (comp) => comp.name === imageName,
    )

    if (!placementComponent) {
      console.warn(`No placement component found for image: ${imageName}`)
      continue
    }

    for (const place of placementComponent.places) {
      debug("processing place...", { place })
      const { x: placeX, y: placeY, side } = place

      for (const pin of image.pins) {
        const padstack = padstacks.find((p) => p.name === pin.padstack_name)
        debug("found padstack", { padstack })

        if (!padstack) {
          console.warn(`No padstack found for pin: ${pin.padstack_name}`)
          continue
        }

        const { x: pinX, y: pinY } = applyToPoint(dsnUnitToMmTransform, {
          x: (placeX || 0) + pin.x,
          y: (placeY || 0) + pin.y,
        })

        const pinIndex = Number(pin.pin_number) - 1
        const pcbComponentId = `${imageName}_${place.refdes}`
        const pcbPortId = `pcb_port_${imageName}-Pad${pin.pin_number}_${place.refdes}`
        const portHints = [pin.pin_number.toString()]

        const rectDimensions = getRectSmtPadDimensions(padstack)

        if (rectDimensions) {
          debug("determining layer with padstack shapes", {
            shapes: padstack.shapes,
            layer: rectDimensions.layer,
          })
          const smtPad: PcbSmtPad = {
            type: "pcb_smtpad",
            pcb_smtpad_id: `pcb_smtpad_${imageName}_${place.refdes}_${pinIndex}`,
            pcb_component_id: pcbComponentId,
            pcb_port_id: pcbPortId,
            shape: "rect",
            x: pinX,
            y: pinY,
            width: rectDimensions.width,
            height: rectDimensions.height,
            layer: rectDimensions.layer,
            port_hints: portHints,
          }
          elements.push(smtPad)
          continue
        }

        if (isThruHolePadstack(padstack)) {
          const circleShape = padstack.shapes.find(
            (s) => s.shapeType === "circle",
          )!
          const outerDiameter = circleShape.diameter / 1000
          const holeDiameter = getHoleDiameterFromPadstackName(
            padstack.name,
            outerDiameter,
          )

          const platedHole: PcbPlatedHole = {
            type: "pcb_plated_hole",
            shape: "circle",
            pcb_plated_hole_id: `pcb_plated_hole_${imageName}_${place.refdes}_${pinIndex}`,
            pcb_component_id: pcbComponentId,
            pcb_port_id: pcbPortId,
            x: pinX,
            y: pinY,
            outer_diameter: outerDiameter,
            hole_diameter: holeDiameter,
            layers: ["top", "bottom"],
            port_hints: portHints,
          }
          elements.push(platedHole)
          continue
        }

        const circleShape = padstack.shapes.find(
          (s) => s.shapeType === "circle",
        )
        if (circleShape) {
          const smtPad: PcbSmtPad = {
            type: "pcb_smtpad",
            pcb_smtpad_id: `pcb_smtpad_${imageName}_${place.refdes}_${pinIndex}`,
            pcb_component_id: pcbComponentId,
            pcb_port_id: pcbPortId,
            shape: "circle",
            x: pinX,
            y: pinY,
            radius: circleShape.diameter / 2 / 1000,
            layer: side === "front" ? "top" : "bottom",
            port_hints: portHints,
          }
          elements.push(smtPad)
          continue
        }

        console.warn(`No valid shape found for padstack: ${padstack.name}`)
      }
    }
  }

  return elements
}
