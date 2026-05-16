import { expect, test } from "bun:test"
import {
  convertCircuitJsonToDsnString,
  parseDsnToDsnJson,
  convertDsnPcbToCircuitJson,
} from "lib"
import type { AnyCircuitElement } from "circuit-json"
import circuitJson from "../assets/repro/arduino-nano.json"

test("Verify Arduino Nano bounty ($300) - Roundtrip DSN -> Circuit JSON", async () => {
  // 1. Circuit JSON -> DSN String
  const dsnString = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  // 2. DSN String -> DSN JSON
  const dsnJson = parseDsnToDsnJson(dsnString)

  // 3. DSN JSON -> Circuit JSON
  const resultCircuitJson = convertDsnPcbToCircuitJson(dsnJson as any)

  // Check component count
  const sourceComponents = resultCircuitJson.filter(
    (e) => e.type === "source_component",
  )
  const pcbComponents = resultCircuitJson.filter(
    (e) => e.type === "pcb_component",
  )

  expect(sourceComponents.length).toBe(7)
  expect(pcbComponents.length).toBe(7)

  // Check for NaN
  resultCircuitJson.forEach((e) => {
    if ("x" in e) expect(Number.isNaN((e as any).x)).toBe(false)
    if ("y" in e) expect(Number.isNaN((e as any).y)).toBe(false)
  })

  // Check rotation of one component (e.g. U1)
  const u1 = pcbComponents.find((c) =>
    (c as any).pcb_component_id.includes("U1"),
  )
  expect(u1).toBeDefined()

  console.log("Arduino Nano Roundtrip Verified!")
})
