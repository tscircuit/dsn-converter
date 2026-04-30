import { test, expect } from "bun:test"

test("convertWiresToPcbTraces exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-wires-to-traces"
  )
  expect(typeof module.convertWiresToPcbTraces).toBe("function")
})
