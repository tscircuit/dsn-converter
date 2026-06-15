import type { Padstack } from "../../types"

const DEFAULT_OUTER_DIAMETER_MM = 0.6
const DEFAULT_HOLE_DIAMETER_MM = 0.3

const getViaDiameterFromName = (padstackName?: string) => {
  const match = padstackName?.match(
    /Via\[\d+-\d+\]_(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)_um/,
  )
  if (!match) return {}

  return {
    outerDiameter: Number(match[1]) / 1000,
    holeDiameter: Number(match[2]) / 1000,
  }
}

export const getViaDimensions = (padstack?: Padstack) => {
  const nameDimensions = getViaDiameterFromName(padstack?.name)
  const circleShape = padstack?.shapes.find(
    (shape) => shape.shapeType === "circle",
  )

  return {
    outerDiameter:
      circleShape?.diameter !== undefined
        ? circleShape.diameter / 1000
        : (nameDimensions.outerDiameter ?? DEFAULT_OUTER_DIAMETER_MM),
    holeDiameter: nameDimensions.holeDiameter ?? DEFAULT_HOLE_DIAMETER_MM,
  }
}
