import { test, expect } from "bun:test"
import { computeSegIntersection } from "lib/utils/compute-seg-intersection"

test("computeSegIntersection handles intersecting segments", () => {
  const result = computeSegIntersection(
    { x1: 0, y1: 0, x2: 10, y2: 10 },
    { x1: 0, y1: 10, x2: 10, y2: 0 },
  )
  expect(result).toBeDefined()
})

test("computeSegIntersection handles parallel lines", () => {
  const result = computeSegIntersection(
    { x1: 0, y1: 0, x2: 10, y2: 0 },
    { x1: 0, y1: 5, x2: 10, y2: 5 },
  )
  expect(result).toBeNull()
})
