import { test, expect } from "bun:test"

test("convertWiringViaToPcbVias exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-wiring-via-to-pcb-vias"
  )
  expect(typeof module.convertWiringViaToPcbVias).toBe("function")
})
