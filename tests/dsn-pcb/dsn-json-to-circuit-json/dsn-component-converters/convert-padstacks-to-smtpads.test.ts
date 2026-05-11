import { test, expect } from "bun:test"

test("convertPadstacksToSmtPads exports function", async () => {
  const module = await import(
    "lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-padstacks-to-smtpads"
  )
  expect(typeof module.convertPadstacksToSmtPads).toBe("function")
})
