import type { AnyCircuitElement, PcbPlatedHole, PcbSmtPad } from "circuit-json"
import Debug from "debug"
import type { DsnPcb, Padstack } from "lib/dsn-pcb/types"
import { parsePadstackName } from "lib/utils/get-padstack-name"
import { applyToPoint } from "transformation-matrix"

const debug = Debug("dsn-converter:convertPadstacksToSmtpads")

// Layer name sets for front and back copper — covers KiCad (F.Cu/B.Cu) and
// Freerouting/other tools (Top/Bottom)
const FRONT_COPPER = new Set(["F.Cu", "Top", "F_Cu"])
const BACK_COPPER = new Set(["B.Cu", "Bottom", "B_Cu"])

function isThruHolePadstack(padstack: Padstack): boolean {
  const layers = padstack.shapes.map((s) => s.layer)
  return (
    layers.some((l) => FRONT_COPPER.has(l)) &&
    layers.some((l) => BACK_COPPER.has(l))
  )
}

function getLayerFromPadstack(
  padstack: DsnPcb["library"]["padstacks"][number],
) {
  return padstack.shapes[0].layer.includes("B.") ||
    padstack.shapes[0].layer === "Bottom"
    ? "bottom"
    : "top"
}

function getPolygonPoints(
  coordinates: number[],
  center: { x: number; y: number },
) {
  const points: Array<{ x: number; y: number }> = []

  for (let i = 0; i < coordinates.length; i += 2) {
    const point = {
      x: center.x + coordinates[i] / 1000,
      y: center.y + coordinates[i + 1] / 1000,
    }

    const firstPoint = points[0]
    const isClosingPoint =
      firstPoint &&
      point.x === firstPoint.x &&
      point.y === firstPoint.y &&
      i === coordinates.length - 2

    if (!isClosingPoint) {
      points.push(point)
    }
  }

  return points
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

function isApproximatelyEqual(a: number, b: number) {
  return Math.abs(a - b) < 1e-6
}

export function convertPadstacksToSmtPads(
  pcb: DsnPcb,
  dsnToCircuitJsonTransform: any,
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

      image.pins.forEach((pin) => {
        const padstack = padstacks.find((p) => p.name === pin.padstack_name)
        debug("found padstack", { padstack })

        if (!padstack) {
          console.warn(`No padstack found for pin: ${pin.padstack_name}`)
          return
        }

        const { x: circuitX, y: circuitY } = applyToPoint(
          dsnToCircuitJsonTransform,
          {
            x: (compX || 0) + pin.x,
            y: (compY || 0) + pin.y,
          },
        )

        const commonIds = {
          pcb_component_id: `${componentId}_${place.refdes}`,
          pcb_port_id: `pcb_port_${componentId}-Pad${pin.pin_number}_${place.refdes}`,
          port_hints: [pin.pin_number.toString()],
        }
        const parsedPadstackName = parsePadstackName(padstack.name)

        // ── Through-hole detection ──────────────────────────────────────────
        if (isThruHolePadstack(padstack)) {
          const circleShape = padstack.shapes.find(
            (s) => s.shapeType === "circle",
          )
          const pathShape = padstack.shapes.find((s) => s.shapeType === "path")

          if (circleShape && circleShape.shapeType === "circle") {
            const outerDiameter = circleShape.diameter / 1000

            // Prefer explicit hole from parser, then name convention, then 60% estimate
            const holeDiameter =
              padstack.hole?.diameter !== undefined
                ? padstack.hole.diameter / 1000
                : parsedPadstackName?.shape === "circle"
                  ? parsedPadstackName.holeDiameter
                  : outerDiameter * 0.6

            const platedHole: PcbPlatedHole = {
              type: "pcb_plated_hole",
              pcb_plated_hole_id: `pcb_plated_hole_${componentId}_${place.refdes}_${pin.pin_number}`,
              ...commonIds,
              shape: "circle",
              x: circuitX,
              y: circuitY,
              outer_diameter: outerDiameter,
              hole_diameter: holeDiameter,
              layers: ["top", "bottom"],
            }
            elements.push(platedHole)
            return
          }

          if (pathShape && pathShape.shapeType === "path") {
            const [x1, y1, x2, y2] = pathShape.coordinates
            const strokeWidth = pathShape.width / 1000
            const endpointDist =
              Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 1000
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

            const platedHole: PcbPlatedHole = {
              type: "pcb_plated_hole",
              pcb_plated_hole_id: `pcb_plated_hole_${componentId}_${place.refdes}_${pin.pin_number}`,
              ...commonIds,
              shape: "oval",
              x: circuitX,
              y: circuitY,
              outer_width: outerWidth,
              outer_height: outerHeight,
              hole_width: holeWidth,
              hole_height: holeHeight,
              ccw_rotation: 0,
              layers: ["top", "bottom"],
            }
            elements.push(platedHole)
            return
          }
        }

        // ── SMT pad (single-layer or unrecognised padstack) ─────────────────
        const rectShape = padstack.shapes.find((s) => s.shapeType === "rect")
        const polygonShape = padstack.shapes.find(
          (s) => s.shapeType === "polygon",
        )
        const circleShape = padstack.shapes.find(
          (s) => s.shapeType === "circle",
        )
        const pathShape = padstack.shapes.find((s) => s.shapeType === "path")

        debug("found shapes", {
          rectShape,
          polygonShape,
          circleShape,
          pathShape,
        })

        let width: number
        let height: number

        if (rectShape) {
          const [x1, y1, x2, y2] = rectShape.coordinates
          width = Math.abs(x2 - x1) / 1000
          height = Math.abs(y2 - y1) / 1000
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
          width = Math.abs(maxX - minX) / 1000
          height = Math.abs(maxY - minY) / 1000
        } else if (pathShape) {
          const [x1, y1, x2, y2] = pathShape.coordinates
          width = pathShape.width / 1000
          height = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 1000
        } else if (circleShape) {
          const radius = circleShape.diameter / 2 / 1000
          width = radius
          height = radius
        } else {
          console.warn(`No valid shape found for padstack: ${padstack.name}`)
          return
        }

        let pcbPad: PcbSmtPad
        const rectangleDimensionsFromPolygon = polygonShape
          ? getRectangleDimensionsFromPolygon(polygonShape.coordinates)
          : null
        const shouldImportPolygonAsRect =
          !!polygonShape && !!rectangleDimensionsFromPolygon

        if (polygonShape && !shouldImportPolygonAsRect) {
          const layer = getLayerFromPadstack(padstack)
          pcbPad = {
            type: "pcb_smtpad",
            pcb_smtpad_id: `pcb_smtpad_${componentId}_${place.refdes}_${Number(pin.pin_number) - 1}`,
            ...commonIds,
            shape: "polygon",
            points: getPolygonPoints(polygonShape.coordinates, {
              x: circuitX,
              y: circuitY,
            }),
            layer,
          }
        } else if (rectShape || pathShape || shouldImportPolygonAsRect) {
          const layer = getLayerFromPadstack(padstack)
          pcbPad = {
            type: "pcb_smtpad",
            pcb_smtpad_id: `pcb_smtpad_${componentId}_${place.refdes}_${Number(pin.pin_number) - 1}`,
            ...commonIds,
            shape: "rect",
            x: circuitX,
            y: circuitY,
            width: rectangleDimensionsFromPolygon?.width ?? width,
            height: rectangleDimensionsFromPolygon?.height ?? height,
            layer,
          }
        } else {
          pcbPad = {
            type: "pcb_smtpad",
            pcb_smtpad_id: `pcb_smtpad_${componentId}_${place.refdes}_${Number(pin.pin_number) - 1}`,
            ...commonIds,
            shape: "circle",
            x: circuitX,
            y: circuitY,
            radius: circleShape!.diameter / 2 / 1000,
            layer: side === "front" ? "top" : "bottom",
          }
        }

        elements.push(pcbPad)
      })
    })
  })
  return elements
}
