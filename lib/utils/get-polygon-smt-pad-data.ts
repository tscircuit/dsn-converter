import type { PcbSmtPad } from "circuit-json"

type PcbSmtPadPolygon = Extract<PcbSmtPad, { shape: "polygon" }>

function roundMicrons(value: number): number {
  return Number(value.toFixed(3))
}

function getNormalizedPoints(points: PcbSmtPadPolygon["points"]) {
  if (points.length < 2) return points

  const first = points[0]
  const last = points[points.length - 1]

  if (first.x === last.x && first.y === last.y) {
    return points.slice(0, -1)
  }

  return points
}

function getBoundingBox(points: PcbSmtPadPolygon["points"]) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const point of points) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }

  return { minX, maxX, minY, maxY }
}

function getPolygonCentroid(points: PcbSmtPadPolygon["points"]) {
  let signedArea = 0
  let centroidX = 0
  let centroidY = 0

  for (let i = 0; i < points.length; i++) {
    const current = points[i]
    const next = points[(i + 1) % points.length]
    const cross = current.x * next.y - next.x * current.y

    signedArea += cross
    centroidX += (current.x + next.x) * cross
    centroidY += (current.y + next.y) * cross
  }

  if (signedArea === 0) return null

  const areaFactor = signedArea * 3

  return {
    x: centroidX / areaFactor,
    y: centroidY / areaFactor,
  }
}

export function getPolygonSmtPadData(pad: PcbSmtPadPolygon) {
  const points = getNormalizedPoints(pad.points)
  const { minX, maxX, minY, maxY } = getBoundingBox(points)
  const centroid = getPolygonCentroid(points)
  const center = centroid ?? {
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
