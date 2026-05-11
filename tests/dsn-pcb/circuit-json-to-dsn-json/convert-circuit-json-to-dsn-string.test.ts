import { test, expect } from "bun:test"

test("convertCircuitJsonToDsnString exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/circuit-json-to-dsn-json/convert-circuit-json-to-dsn-string"
  )
  expect(typeof module.convertCircuitJsonToDsnString).toBe("function")
})
