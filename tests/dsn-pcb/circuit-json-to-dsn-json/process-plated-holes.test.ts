import { test, expect } from "bun:test"

test("processPlatedHoles exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/circuit-json-to-dsn-json/process-plated-holes"
  )
  expect(typeof module.processPlatedHoles).toBe("function")
})
