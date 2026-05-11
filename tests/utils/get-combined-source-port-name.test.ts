import { test, expect } from "bun:test"

test("getCombinedSourcePortName exports function", async () => {
  const module = await import("lib/utils/get-combined-source-port-name")
  expect(typeof module.getCombinedSourcePortName).toBe("function")
})
