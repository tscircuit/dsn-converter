import { test, expect } from "bun:test"

test("convertNetsToSourceNetsAndTraces exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-nets-to-source-nets-and-traces"
  )
  expect(typeof module.convertNetsToSourceNetsAndTraces).toBe("function")
})
