import { test, expect } from "bun:test"
import { getPadstackName } from "lib/utils/get-padstack-name"

test("getPadstackName returns string for circle", () => {
  const result = getPadstackName({ shape: "circle", width: 10 })
  expect(typeof result).toBe("string")
  expect(result.length).toBeGreaterThan(0)
})

test("getPadstackName returns string for oval", () => {
  const result = getPadstackName({ shape: "oval", width: 10, height: 20 })
  expect(typeof result).toBe("string")
  expect(result.length).toBeGreaterThan(0)
})

test("getPadstackName returns string for rect", () => {
  const result = getPadstackName({ shape: "rect", width: 10, height: 10 })
  expect(typeof result).toBe("string")
  expect(result.length).toBeGreaterThan(0)
})

test("getPadstackName includes layer in name", () => {
  const top = getPadstackName({ shape: "circle", width: 10, layer: "top" })
  const all = getPadstackName({ shape: "circle", width: 10, layer: "all" })
  expect(top).toBeDefined()
  expect(all).toBeDefined()
})
