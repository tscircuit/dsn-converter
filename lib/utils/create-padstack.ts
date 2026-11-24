import type { PcbSmtPad } from "circuit-json"
import type { Padstack } from "../dsn-pcb/types"
import { generateLayerNames } from "./generate-layers"

export function createCircularPadstack(
  name: string,
  outerDiameter: number,
  holeDiameter: number,
  numLayers = 2,
): Padstack {
  return {
    name,
    shapes: generateLayerNames(numLayers).map((layer) => ({
      shapeType: "circle" as const,
      layer,
      diameter: outerDiameter,
    })),
    hole: {
      shape: "circle",
      diameter: holeDiameter,
    },
    attach: "off",
  }
}

function roundMicrons(value: number): number {
  return Number(value.toFixed(3))
}

export function createOvalPadstack(
  name: string,
  outerWidth: number,
  outerHeight: number,
  holeWidth: number,
  holeHeight: number,
  numLayers = 2,
  ccwRotation = 0,
): Padstack {
  const pathOffset = Math.abs(outerWidth - outerHeight) / 2

  // Determine orientation based on dimensions
  const isHorizontal = outerWidth >= outerHeight
  const baseEndpoints = isHorizontal
    ? [
        { x: -pathOffset, y: 0 },
        { x: pathOffset, y: 0 },
      ]
    : [
        { x: 0, y: -pathOffset },
        { x: 0, y: pathOffset },
      ]

  const radians = (ccwRotation * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const coordinates =
    Math.abs(ccwRotation % 180) < 1e-6
      ? [
          baseEndpoints[0].x,
          baseEndpoints[0].y,
          baseEndpoints[1].x,
          baseEndpoints[1].y,
        ]
      : baseEndpoints.flatMap((pt) => [
          roundMicrons(pt.x * cos - pt.y * sin),
          roundMicrons(pt.x * sin + pt.y * cos),
        ])

  return {
    name,
    shapes: generateLayerNames(numLayers).map((layer) => ({
      shapeType: "path" as const,
      layer,
      width: isHorizontal ? outerHeight : outerWidth,
      coordinates,
    })),
    hole: {
      shape: "oval",
      width: holeWidth,
      height: holeHeight,
    },
    attach: "off",
  }
}

export function createRectangularPadstack(
  name: string,
  width: number,
  height: number,
  layer: PcbSmtPad["layer"],
): Padstack {
  const halfWidth = width / 2
  const halfHeight = height / 2

  return {
    name,
    shapes: [
      {
        shapeType: "polygon",
        layer: layer === "bottom" ? "B.Cu" : "F.Cu",
        width: 0,
        coordinates: [
          -halfWidth,
          halfHeight, // Top left
          halfWidth,
          halfHeight, // Top right
          halfWidth,
          -halfHeight, // Bottom right
          -halfWidth,
          -halfHeight, // Bottom left
          -halfWidth,
          halfHeight, // Back to top left to close the polygon
        ],
      },
    ],
    attach: "off",
  }
}

export function createPolygonPadstack({
  name,
  coordinates,
  layer,
}: {
  name: string
  coordinates: number[]
  layer: PcbSmtPad["layer"]
}): Padstack {
  return {
    name,
    shapes: [
      {
        shapeType: "polygon",
        layer: layer === "bottom" ? "B.Cu" : "F.Cu",
        width: 0,
        coordinates,
      },
    ],
    attach: "off",
  }
}

export function createCircularHoleRectangularPadstack(
  name: string,
  outerWidth: number,
  outerHeight: number,
  holeDiameter: number,
  numLayers = 2,
  ccwRotation = 0,
): Padstack {
  const halfWidth = outerWidth / 2
  const halfHeight = outerHeight / 2

  const corners = [
    { x: -halfWidth, y: halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: -halfWidth, y: -halfHeight },
  ]
  const radians = (ccwRotation * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const rotatedCorners =
    Math.abs(ccwRotation % 180) < 1e-6
      ? corners
      : corners.map((pt) => ({
          x: roundMicrons(pt.x * cos - pt.y * sin),
          y: roundMicrons(pt.x * sin + pt.y * cos),
        }))

  // Define the rectangle polygon once so we can reuse for all layers
  const rectPolygon = [
    ...rotatedCorners.flatMap((pt) => [pt.x, pt.y]),
    rotatedCorners[0].x,
    rotatedCorners[0].y,
  ]

  return {
    name,
    shapes: generateLayerNames(numLayers).map((layer) => ({
      shapeType: "polygon" as const,
      layer,
      width: 0,
      coordinates: rectPolygon,
    })),
    hole: {
      shape: "circle",
      diameter: holeDiameter,
    },
    attach: "off",
  }
}
