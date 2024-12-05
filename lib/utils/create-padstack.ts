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
  const pathOffset = (outerWidth - outerHeight) / 2
  return {
    name,
    shapes: [
      {
        shapeType: "path",
        layer: "F.Cu",
        width: outerHeight,
        coordinates: [-pathOffset, 0, pathOffset, 0],
      },
      {
        shapeType: "path",
        layer: "B.Cu",
        width: outerHeight,
        coordinates: [-pathOffset, 0, pathOffset, 0],
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
): Padstack {
  const halfWidth = width / 2
  const halfHeight = height / 2

  return {
    name,
    shapes: [
      {
        shapeType: "polygon",
        layer: "F.Cu",
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
