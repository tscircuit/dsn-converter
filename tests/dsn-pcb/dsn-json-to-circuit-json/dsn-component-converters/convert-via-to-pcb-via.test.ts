import { test, expect } from "bun:test"

test("convertViaToPcbVia exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-via-to-pcb-via"
  )
  expect(typeof module.convertViaToPcbVia).toBe("function")
})
