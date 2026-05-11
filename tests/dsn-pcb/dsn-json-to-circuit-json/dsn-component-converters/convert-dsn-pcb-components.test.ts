import { test, expect } from "bun:test"

test("convertDsnPcbComponentsToSourceComponentsAndPorts exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-dsn-pcb-components-to-source-components-and-ports"
  )
  expect(typeof module.convertDsnPcbComponentsToSourceComponentsAndPorts).toBe(
    "function",
  )
})
