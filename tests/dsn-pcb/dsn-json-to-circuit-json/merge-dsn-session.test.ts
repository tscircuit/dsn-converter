import { test, expect } from "bun:test"

test("mergeDsnSessionIntoDsnPcb exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/merge-dsn-session-into-dsn-pcb"
  )
  expect(typeof module.mergeDsnSessionIntoDsnPcb).toBe("function")
})
