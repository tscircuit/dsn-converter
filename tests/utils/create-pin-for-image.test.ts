import { test, expect } from "bun:test"

test("createPinForImage exports function", async () => {
  const module = await import("lib/utils/create-pin-for-image")
  expect(typeof module.createPinForImage).toBe("function")
})
