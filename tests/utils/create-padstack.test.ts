import { test, expect } from "bun:test"

test("createCircularPadstack exports function", async () => {
  const module = await import("lib/utils/create-padstack")
  expect(typeof module.createCircularPadstack).toBe("function")
})
