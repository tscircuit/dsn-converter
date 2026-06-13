import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnJson, convertCircuitJsonToDsnString } from "lib"

import type { AnyCircuitElement } from "circuit-json"
import circuitJson from "../assets/repro/XIAO_S3.json"

test("smtpad shape circle have correct padstack name", async () => {
  const dsnJson = convertCircuitJsonToDsnJson(
    circuitJson as AnyCircuitElement[],
  )

  const padstackName = dsnJson.library.padstacks.filter(
    (padstack) => padstack.name === "Round[T]Pad_1600_1600_um",
  )
  expect(padstackName).toBeDefined()
  expect(padstackName?.length).toBe(1)
  expect(padstackName?.[0].shapes).toEqual([
    {
      shapeType: "circle",
      layer: "F.Cu",
      diameter: 1600,
    },
  ])
  expect(padstackName?.[0].hole).toBeUndefined()
})
