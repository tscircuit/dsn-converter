import { test, expect } from "bun:test"
import { getComponentValue } from "lib/utils/get-component-value"

test("getComponentValue returns empty for null", () => {
  expect(getComponentValue(null)).toBe("")
})

test("getComponentValue returns empty for undefined", () => {
  expect(getComponentValue(undefined)).toBe("")
})

test("getComponentValue formats resistance < 1000 ohm", () => {
  expect(getComponentValue({ resistance: 470 })).toBe("470")
})

test("getComponentValue formats resistance >= 1000 ohm as k", () => {
  expect(getComponentValue({ resistance: 1000 })).toBe("1k")
})

test("getComponentValue formats capacitance", () => {
  const result = getComponentValue({ capacitance: 0.000001 })
  expect(result).toContain("uF")
})
