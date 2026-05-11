import { test, expect } from "bun:test"

test("findOrCreateViaPadstack exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/circuit-json-to-dsn-json/process-pcb-traces/findOrCreateViaPadstack"
  )
  expect(typeof module.findOrCreateViaPadstack).toBe("function")
})
