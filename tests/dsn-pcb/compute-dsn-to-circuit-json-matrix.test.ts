import { test, expect } from "bun:test"

const computeIntersection = (
  seg1: { x1: number; y1: number; x2: number; y2: number },
  seg2: { x1: number; y1: number; x2: number; y2: number },
) => {
  // Get vector components
  const v1x = seg1.x2 - seg1.x1
  const v1y = seg1.y2 - seg1.y1
  const v2x = seg2.x2 - seg2.x1
  const v2y = seg2.y2 - seg2.y1

  // Calculate cross product of vectors
  const cross = v1x * v2y - v1y * v2x

  // Check if lines are parallel (cross product near 0)
  if (Math.abs(cross) < 0.00000001) {
    console.log("lines are parallel")
    return null
  }

  // Calculate intersection point using parametric form
  const t = ((seg2.x1 - seg1.x1) * v2y - (seg2.y1 - seg1.y1) * v2x) / cross

  // Check if intersection point lies within both line segments
  // if (t < 0 || t > 1) {
  //   console.log("t is out of bounds")
  //   return null
  // }

  const s = ((seg2.x1 - seg1.x1) * v1y - (seg2.y1 - seg1.y1) * v1x) / cross
  // if (s < 0 || s > 1) {
  //   console.log("s is out of bounds")
  //   return null
  // }

  // Calculate intersection point
  return {
    x: seg1.x1 + t * v1x,
    y: seg1.y1 + t * v1y,
  }
}

test("compute dsn to circuit json matrix", () => {
  const coordinates = [
    { x1: 148405.0, y1: -105000.0, x2: 148405.0, y2: -105000.1 },
    { x1: 0.0, y1: -105601.7, x2: 0.1, y2: -105601.7 },
    { x1: 155003.3, y1: -105000.0, x2: 155003.4, y2: -104999.9 },
    { x1: 155604.9, y1: -105000.0, x2: 155605.0, y2: -105000.0 },
  ].map((a) => ({
    x1: a.x1 / 1000,
    y1: a.y1 / 1000,
    x2: a.x2 / 1000,
    y2: a.y2 / 1000,
  }))

  const SEG1 = coordinates[0]
  const SEG2 = coordinates[1]
  const SEG3 = coordinates[2]
  const SEG4 = coordinates[3]

  const P1 = computeIntersection(SEG1, SEG2)!
  const P2 = computeIntersection(SEG2, SEG3)!
  const P3 = computeIntersection(SEG3, SEG4)!

  // console.log({ P1, P2, P3 })

  const approximateOutputPoints = [
    { x: 148.4, y: -105.6 },
    { x: 154.4, y: -105.6 },
    { x: 155.0, y: -105.0 },
  ]

  expect(P1.x).toBeCloseTo(approximateOutputPoints[0].x, 0.1)
  expect(P1.y).toBeCloseTo(approximateOutputPoints[0].y, 0.1)
  expect(P2.x).toBeCloseTo(approximateOutputPoints[1].x, 0.1)
  expect(P2.y).toBeCloseTo(approximateOutputPoints[1].y, 0.1)
  expect(P3.x).toBeCloseTo(approximateOutputPoints[2].x, 0.1)
  expect(P3.y).toBeCloseTo(approximateOutputPoints[2].y, 0.1)
})
