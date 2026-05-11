import { test, expect } from "bun:test"

test("convertWiringPathToPcbTraces exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-wiring-path-to-pcb-traces"
  )
  expect(typeof module.convertWiringPathToPcbTraces).toBe("function")
})
