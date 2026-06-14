import type { PcbSmtPad } from "circuit-json"
import { getBoundsFromPoints } from "@tscircuit/math-utils"

type PolygonPcbSmtPad = Extract<PcbSmtPad, { shape: "polygon" }>

export interface PolygonSmtPadGeometry {
  center: { x: number; y: number }
  widthUm: number
  heightUm: number
  relativePointsUm: number[]
}

function roundMicrons(microns: number): number {
  return Number(microns.toFixed(3))
}

function getNormalizedPoints(points: PolygonPcbSmtPad["points"]) {
  if (points.length < 2) return points

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]

  if (firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y) {
    return points.slice(0, -1)
  }

  return points
}

function getPolygonCentroid(points: PolygonPcbSmtPad["points"]) {
  let signedArea = 0
  let centroidX = 0
  let centroidY = 0

  for (let index = 0; index < points.length; index++) {
    const currentPoint = points[index]
    const nextPoint = points[(index + 1) % points.length]
    const crossProduct =
      currentPoint.x * nextPoint.y - nextPoint.x * currentPoint.y

    signedArea += crossProduct
    centroidX += (currentPoint.x + nextPoint.x) * crossProduct
    centroidY += (currentPoint.y + nextPoint.y) * crossProduct
  }

  if (signedArea === 0) return null

  const areaFactor = signedArea * 3

  return {
    x: centroidX / areaFactor,
    y: centroidY / areaFactor,
  }
}

export function getPolygonSmtPadGeometry(
  pad: PolygonPcbSmtPad,
): PolygonSmtPadGeometry {
  const points = getNormalizedPoints(pad.points)
  const bounds = getBoundsFromPoints(points)
  if (!bounds) {
    return {
      center: { x: 0, y: 0 },
      widthUm: 0,
      heightUm: 0,
      relativePointsUm: [],
    }
  }

  const { minX, maxX, minY, maxY } = bounds
  const polygonCentroid = getPolygonCentroid(points)
  const center = polygonCentroid ?? {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  }

  const relativePointsUm = points.flatMap((point) => [
    roundMicrons((point.x - center.x) * 1000),
    roundMicrons((point.y - center.y) * 1000),
  ])

  if (points.length > 0) {
    relativePointsUm.push(relativePointsUm[0], relativePointsUm[1])
  }

  return {
    center,
    widthUm: roundMicrons((maxX - minX) * 1000),
    heightUm: roundMicrons((maxY - minY) * 1000),
    relativePointsUm,
  }
}
