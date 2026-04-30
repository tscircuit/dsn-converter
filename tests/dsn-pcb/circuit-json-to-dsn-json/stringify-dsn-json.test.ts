import { test, expect } from "bun:test"

test("stringifyDsnJson exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
  )
  expect(typeof module.stringifyDsnJson).toBe("function")
})
