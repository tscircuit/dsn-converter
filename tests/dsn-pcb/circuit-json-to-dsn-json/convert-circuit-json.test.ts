import { test, expect } from "bun:test"

test("convertCircuitJsonToDsnJson exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/circuit-json-to-dsn-json/convert-circuit-json-to-dsn-json"
  )
  expect(typeof module.convertCircuitJsonToDsnJson).toBe("function")
})
