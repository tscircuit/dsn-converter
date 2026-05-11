import { test, expect } from "bun:test"

test("convertDsnJsonToCircuitJson exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json"
  )
  expect(typeof module.convertDsnJsonToCircuitJson).toBe("function")
})
