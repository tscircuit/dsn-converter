import { test, expect } from "bun:test"

test("convertDsnSessionToCircuitJson exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-session-to-circuit-json"
  )
  expect(typeof module.convertDsnSessionToCircuitJson).toBe("function")
})
