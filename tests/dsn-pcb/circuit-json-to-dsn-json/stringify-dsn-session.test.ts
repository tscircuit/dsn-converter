import { test, expect } from "bun:test"

test("stringifyDsnSession exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-session"
  )
  expect(typeof module.stringifyDsnSession).toBe("function")
})
