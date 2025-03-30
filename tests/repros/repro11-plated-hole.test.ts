import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnJson } from "lib"

import circuitJson from "../assets/repro/XIAO_S3.json"
import type { AnyCircuitElement } from "circuit-json"

test("smtpad shape circle have correct padstack name", async () => {
  const dsnJson = convertCircuitJsonToDsnJson(
    circuitJson as AnyCircuitElement[],
  )

  const padstackName = dsnJson.library.padstacks.filter(
    (padstack) => padstack.name === "Round[T]Pad_800_800_um",
  )
  expect(padstackName).toBeDefined()
  expect(padstackName?.length).toBe(1)
  expect(padstackName?.[0].shapes.length).toBe(2)
  expect(padstackName?.[0].hole?.shape).toBe("circle")
  expect(padstackName?.[0].hole?.diameter).toBe(800)
})
