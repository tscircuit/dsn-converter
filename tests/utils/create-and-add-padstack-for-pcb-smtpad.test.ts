import { test, expect } from "bun:test"

test("createAndAddPadstackFromPcbSmtPad exports function", async () => {
  const module = await import(
    "lib/utils/create-and-add-padstack-for-pcb-smtpad"
  )
  expect(typeof module.createAndAddPadstackFromPcbSmtPad).toBe("function")
})
