import type { PcbPlatedHole } from "circuit-json"
import type { DsnPcb, Padstack } from "lib/dsn-pcb/types"
import { parsePadstackName } from "lib/utils/get-padstack-name"
import { applyToPoint, scale } from "transformation-matrix"

const FRONT_COPPER = new Set(["F.Cu", "Top", "F_Cu"])
const BACK_COPPER = new Set(["B.Cu", "Bottom", "B_Cu"])

function isApproximatelyEqual(a: number, b: number) {
  return Math.abs(a - b) < 1e-6
}

export function isThruHolePadstack(padstack: Padstack): boolean {
  const layers = padstack.shapes.map((s) => s.layer)
  return (
    layers.some((l) => FRONT_COPPER.has(l)) &&
    layers.some((l) => BACK_COPPER.has(l))
  )
}

function getRectangleDimensionsFromPolygon(coordinates: number[]) {
  const uniquePoints = new Map<string, { x: number; y: number }>()

  for (let i = 0; i < coordinates.length; i += 2) {
    const x = coordinates[i]
    const y = coordinates[i + 1]
    uniquePoints.set(`${x},${y}`, { x, y })
  }

  if (uniquePoints.size !== 4) return null

  const xs = [...new Set([...uniquePoints.values()].map((point) => point.x))]
  const ys = [...new Set([...uniquePoints.values()].map((point) => point.y))]

  if (xs.length !== 2 || ys.length !== 2) return null

  const corners = new Set(xs.flatMap((x) => ys.map((y) => `${x},${y}`)))

  if ([...uniquePoints.keys()].some((point) => !corners.has(point))) {
    return null
  }

  return {
    width: Math.abs(xs[1] - xs[0]) / 1000,
    height: Math.abs(ys[1] - ys[0]) / 1000,
  }
}

export function convertThroughHolePadstackToPlatedHole({
  padstack,
  x,
  y,
  pcbPlatedHoleId,
  commonIds,
  includeRectPadstacks = false,
}: {
  padstack: Padstack
  x: number
  y: number
  pcbPlatedHoleId: string
  commonIds: {
    pcb_component_id: string
    pcb_port_id: string
    port_hints: string[]
  }
  includeRectPadstacks?: boolean
}): PcbPlatedHole | null {
  if (!isThruHolePadstack(padstack)) return null

  const parsedPadstackName = parsePadstackName(padstack.name)
  const circleShape = padstack.shapes.find((s) => s.shapeType === "circle")
  const pathShape = padstack.shapes.find((s) => s.shapeType === "path")
  const rectShape = padstack.shapes.find((s) => s.shapeType === "rect")
  const polygonShape = padstack.shapes.find((s) => s.shapeType === "polygon")

  if (circleShape && circleShape.shapeType === "circle") {
    const outerDiameter = circleShape.diameter / 1000
    const holeDiameter =
      padstack.hole?.diameter !== undefined
        ? padstack.hole.diameter / 1000
        : parsedPadstackName?.shape === "circle"
          ? parsedPadstackName.holeDiameter
          : outerDiameter * 0.6

    return {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: pcbPlatedHoleId,
      ...commonIds,
      shape: "circle",
      x,
      y,
      outer_diameter: outerDiameter,
      hole_diameter: holeDiameter,
      layers: ["top", "bottom"],
    }
  }

  if (pathShape && pathShape.shapeType === "path") {
    const [x1, y1, x2, y2] = pathShape.coordinates
    const strokeWidth = pathShape.width / 1000
    const endpointDist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 1000
    const isHorizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1)

    const major = endpointDist + strokeWidth
    const minor = strokeWidth
    const outerWidth = isHorizontal ? major : minor
    const outerHeight = isHorizontal ? minor : major

    let holeWidth: number
    let holeHeight: number
    if (padstack.hole?.width !== undefined) {
      holeWidth = padstack.hole.width / 1000
      holeHeight = (padstack.hole.height ?? padstack.hole.width) / 1000
    } else {
      const parsedNameMatchesOuterDimensions =
        parsedPadstackName?.shape === "oval" &&
        isApproximatelyEqual(parsedPadstackName.width, outerWidth) &&
        isApproximatelyEqual(parsedPadstackName.height, outerHeight)

      if (
        parsedPadstackName?.shape === "oval" &&
        !parsedNameMatchesOuterDimensions
      ) {
        holeWidth = parsedPadstackName.width
        holeHeight = parsedPadstackName.height
      } else {
        holeWidth = outerWidth * 0.6
        holeHeight = outerHeight * 0.6
      }
    }

    return {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: pcbPlatedHoleId,
      ...commonIds,
      shape: "oval",
      x,
      y,
      outer_width: outerWidth,
      outer_height: outerHeight,
      hole_width: holeWidth,
      hole_height: holeHeight,
      ccw_rotation: 0,
      layers: ["top", "bottom"],
    }
  }

  if (!includeRectPadstacks && padstack.hole === undefined) {
    return null
  }

  const rectDims =
    rectShape && rectShape.shapeType === "rect"
      ? {
          width:
            Math.abs(rectShape.coordinates[2] - rectShape.coordinates[0]) /
            1000,
          height:
            Math.abs(rectShape.coordinates[3] - rectShape.coordinates[1]) /
            1000,
        }
      : polygonShape && polygonShape.shapeType === "polygon"
        ? getRectangleDimensionsFromPolygon(polygonShape.coordinates)
        : null

  if (rectDims) {
    const holeDiameter =
      padstack.hole?.diameter !== undefined
        ? padstack.hole.diameter / 1000
        : Math.min(rectDims.width, rectDims.height) * 0.6

    return {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: pcbPlatedHoleId,
      ...commonIds,
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      x,
      y,
      rect_pad_width: rectDims.width,
      rect_pad_height: rectDims.height,
      hole_diameter: holeDiameter,
      hole_offset_x: 0,
      hole_offset_y: 0,
      layers: ["top", "bottom"],
    }
  }

  return null
}

export function convertDsnJsonHolesToPlatedHoles(
  pcb: DsnPcb,
  dsnToCircuitJsonTransform = scale(1 / 1000),
): PcbPlatedHole[] {
  const platedHoles: PcbPlatedHole[] = []
  const { padstacks, images } = pcb.library

  for (const image of images) {
    const componentId = image.name
    const placementComponent = pcb.placement.components.find(
      (comp) => comp.name === componentId,
    )
    if (!placementComponent) continue

    for (const place of placementComponent.places) {
      const { x: compX, y: compY } = place
      for (const pin of image.pins) {
        const padstack = padstacks.find((p) => p.name === pin.padstack_name)
        if (!padstack) continue

        const { x: circuitX, y: circuitY } = applyToPoint(
          dsnToCircuitJsonTransform,
          {
            x: (compX || 0) + pin.x,
            y: (compY || 0) + pin.y,
          },
        )
        const platedHole = convertThroughHolePadstackToPlatedHole({
          padstack,
          x: circuitX,
          y: circuitY,
          pcbPlatedHoleId: `pcb_plated_hole_${componentId}_${place.refdes}_${pin.pin_number}`,
          commonIds: {
            pcb_component_id: `${componentId}_${place.refdes}`,
            pcb_port_id: `pcb_port_${componentId}-Pad${pin.pin_number}_${place.refdes}`,
            port_hints: [pin.pin_number.toString()],
          },
          includeRectPadstacks: true,
        })
        if (platedHole) {
          platedHoles.push(platedHole)
        }
      }
    }
  }

  return platedHoles
}
