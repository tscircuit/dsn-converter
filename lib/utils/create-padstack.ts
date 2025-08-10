import type { PcbSmtPad } from "circuit-json"
import type { Padstack } from "../dsn-pcb/types"

export function createCircularPadstack(
  name: string,
  outerDiameter: number,
  holeDiameter: number,
): Padstack {
  return {
    name,
    shapes: [
      {
        shapeType: "circle",
        layer: "F.Cu",
        diameter: outerDiameter,
      },
      {
        shapeType: "circle",
        layer: "B.Cu",
        diameter: outerDiameter,
      },
    ],
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
): Padstack {
  const pathOffset = Math.abs(outerWidth - outerHeight) / 2

  // Determine orientation based on dimensions
  const isHorizontal = outerWidth > outerHeight

  return {
    name,
    shapes: [
      {
        shapeType: "path",
        layer: "F.Cu",
        width: isHorizontal ? outerHeight : outerWidth,
        coordinates: isHorizontal
          ? [-pathOffset, 0, pathOffset, 0] // Horizontal oval
          : [0, -pathOffset, 0, pathOffset], // Vertical oval
      },
      {
        shapeType: "path",
        layer: "B.Cu",
        width: isHorizontal ? outerHeight : outerWidth,
        coordinates: isHorizontal
          ? [-pathOffset, 0, pathOffset, 0] // Horizontal oval
          : [0, -pathOffset, 0, pathOffset], // Vertical oval
      },
    ],
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

export function createCircularHoleRectangularPadstack(
  name: string,
  outerWidth: number,
  outerHeight: number,
  holeDiameter: number,
): Padstack {
  const halfWidth = outerWidth / 2
  const halfHeight = outerHeight / 2

  // Define the rectangle polygon once so we can reuse for both layers
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
    shapes: [
      {
        shapeType: "polygon",
        layer: "F.Cu",
        width: 0,
        coordinates: rectPolygon,
      },
      {
        shapeType: "polygon",
        layer: "B.Cu",
        width: 0,
        coordinates: rectPolygon,
      },
    ],
    hole: {
      shape: "circle",
      diameter: holeDiameter,
    },
    attach: "off",
  }
}
