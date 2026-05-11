import { test, expect } from "bun:test"

test("parseDsnToDsnJson exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
  )
  expect(typeof module.parseDsnToDsnJson).toBe("function")
})
