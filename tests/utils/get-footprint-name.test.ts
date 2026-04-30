import { test, expect } from "bun:test"
import { getFootprintName } from "lib/utils/get-footprint-name"

test("getFootprintName returns empty for missing inputs", () => {
  expect(getFootprintName(null as any, null as any)).toBe("")
})

test("getFootprintName formats correctly", () => {
  const result = getFootprintName(
    { ftype: "capacitor" } as any,
    { width: 1.5, height: 2.5 } as any,
  )
  expect(result).toBe("capacitor:1.5000x2.5000_mm")
})
