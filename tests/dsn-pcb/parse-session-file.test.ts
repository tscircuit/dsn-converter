import { expect, test } from "bun:test"
import { parseDsnToDsnJson } from "lib"
// @ts-ignore
import sessionFile from "../assets/freerouting-sessions/session1.ses" with {
  type: "text",
}

test("parse session file", () => {
  const sessionJson = parseDsnToDsnJson(sessionFile)
  expect(sessionJson).toBeTruthy()
  expect(sessionJson.filename).toBe("test2")

  // Check placement section
  expect(sessionJson.placement.components).toHaveLength(2)
  expect(sessionJson.placement.components[0].name).toBe(
    "Resistor_SMD:R_0402_1005Metric",
  )
  expect(sessionJson.placement.components[1].name).toBe(
    "Capacitor_SMD:C_0603_1608Metric",
  )

  // Check routes section exists
  expect(sessionJson.wiring).toBeTruthy()
  expect(sessionJson.wiring.wires).toHaveLength(3)
})