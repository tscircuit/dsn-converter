import { test, expect } from "bun:test"
import { computeSegIntersection } from "lib/utils/compute-seg-intersection"

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

  const P1 = computeSegIntersection(SEG1, SEG2)!
  const P2 = computeSegIntersection(SEG2, SEG3)!
  const P3 = computeSegIntersection(SEG3, SEG4)!

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
