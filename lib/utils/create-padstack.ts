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

export function createOvalPadstack(
  name: string,
  outerWidth: number,
  outerHeight: number,
  holeWidth: number,
  holeHeight: number,
  numLayers = 2,
): Padstack {
  const pathOffset = Math.abs(outerWidth - outerHeight) / 2

  // Determine orientation based on dimensions
  const isHorizontal = outerWidth > outerHeight

  return {
    name,
    shapes: generateLayerNames(numLayers).map((layer) => ({
      shapeType: "path" as const,
      layer,
      width: isHorizontal ? outerHeight : outerWidth,
      coordinates: isHorizontal
        ? [-pathOffset, 0, pathOffset, 0] // Horizontal oval
        : [0, -pathOffset, 0, pathOffset], // Vertical oval
    })),
    hole: {
      shape: "oval",
      width: holeWidth,
      height: holeHeight,
    },
    attach: "off",
  }
}

export function createOvalSmtPadstack(
  name: string,
  width: number,
  height: number,
  layer: PcbSmtPad["layer"],
): Padstack {
  const pathOffset = Math.abs(width - height) / 2
  const isHorizontal = width > height

  return {
    name,
    shapes: [
      {
        shapeType: "path",
        layer: layer === "bottom" ? "B.Cu" : "F.Cu",
        width: isHorizontal ? height : width,
        coordinates: isHorizontal
          ? [-pathOffset, 0, pathOffset, 0]
          : [0, -pathOffset, 0, pathOffset],
      },
    ],
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

export function createCircularHoleRectangularPadstack(
  name: string,
  outerWidth: number,
  outerHeight: number,
  holeDiameter: number,
  numLayers = 2,
): Padstack {
  const halfWidth = outerWidth / 2
  const halfHeight = outerHeight / 2

  // Define the rectangle polygon once so we can reuse for all layers
  const rectPolygon = [
    -halfWidth,
    halfHeight, // Top-left
    halfWidth,
    halfHeight, // Top-right
    halfWidth,
    -halfHeight, // Bottom-right
    -halfWidth,
    -halfHeight, // Bottom-left
    -halfWidth,
    halfHeight, // Close the polygon
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
