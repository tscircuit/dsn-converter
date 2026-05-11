import { test, expect } from "bun:test"

test("processNets exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/circuit-json-to-dsn-json/process-nets"
  )
  expect(typeof module.processNets).toBe("function")
})
