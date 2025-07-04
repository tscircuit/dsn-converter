import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnJson } from "lib"

import circuitJson from "../assets/repro/XIAO_S3.json"
import type { AnyCircuitElement } from "circuit-json"

test("configuration passed to converter", async () => {
  const dsnJson = convertCircuitJsonToDsnJson(
    circuitJson as AnyCircuitElement[],
    {
      traceClearance: 6969,
    },
  )

  const traceClearance = dsnJson.network.classes[0].rule.clearances[0].value
  expect(traceClearance).toBe(6969)
})
