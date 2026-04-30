import { test, expect } from "bun:test"
import { getTraceLength } from "lib/utils/get-trace-length"

test("getTraceLength returns 0 for single point", () => {
  expect(getTraceLength([{ x: 0, y: 0 }])).toBe(0)
})

test("getTraceLength calculates horizontal distance", () => {
  expect(
    getTraceLength([
      { x: 0, y: 0 },
      { x: 3, y: 0 },
    ]),
  ).toBe(3)
})

test("getTraceLength calculates vertical distance", () => {
  expect(
    getTraceLength([
      { x: 0, y: 0 },
      { x: 0, y: 4 },
    ]),
  ).toBe(4)
})

test("getTraceLength calculates diagonal distance", () => {
  const result = getTraceLength([
    { x: 0, y: 0 },
    { x: 3, y: 4 },
  ])
  expect(result).toBe(5)
})
