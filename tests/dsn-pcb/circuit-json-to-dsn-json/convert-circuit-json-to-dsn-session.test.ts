import { test, expect } from "bun:test"

test("convertCircuitJsonToDsnSession exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/circuit-json-to-dsn-json/convert-circuit-json-to-dsn-session"
  )
  expect(typeof module.convertCircuitJsonToDsnSession).toBe("function")
})
