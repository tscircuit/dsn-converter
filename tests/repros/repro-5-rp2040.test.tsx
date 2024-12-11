import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"

import circuitJson from "../assets/repro/rp2040-module.json"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"

test("circuit json (rp2040) -> dsn file -> dsn json", async () => {
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  try {
    const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
    expect(dsnJson).toBeDefined()
  } catch (error) {
    console.error("Parsing Error:", error)
    throw error
  }
})
