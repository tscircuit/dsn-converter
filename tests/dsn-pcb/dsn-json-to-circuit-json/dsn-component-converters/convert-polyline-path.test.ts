import { test, expect } from "bun:test"

test("convertPolylinePathToPcbTraces exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-polyline-path-to-pcb-traces"
  )
  expect(typeof module.convertPolylinePathToPcbTraces).toBe("function")
})
