import { test, expect } from "bun:test"

test("processComponentsAndPads exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/circuit-json-to-dsn-json/process-components-and-pads"
  )
  expect(typeof module.processComponentsAndPads).toBe("function")
})
