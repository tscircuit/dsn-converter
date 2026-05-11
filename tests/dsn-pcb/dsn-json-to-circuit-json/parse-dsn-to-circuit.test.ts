import { test, expect } from "bun:test"

test("parseDsnToCircuitJson exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-circuit-json"
  )
  expect(typeof module.parseDsnToCircuitJson).toBe("function")
})
