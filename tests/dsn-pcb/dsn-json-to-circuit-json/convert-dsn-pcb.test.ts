import { test, expect } from "bun:test"

test("convertDsnPcbToCircuitJson exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-pcb-to-circuit-json"
  )
  expect(typeof module.convertDsnPcbToCircuitJson).toBe("function")
})
