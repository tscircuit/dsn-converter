import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"

import circuitJson from "../assets/repro/pill-shaped-plated-hole.json"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"

test("check pill shape plated hole dimension", async () => {
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson2 = convertDsnJsonToCircuitJson(dsnJson)

  // TODO: udpate the test to convert this to plated_hole
  // check if the smtpad has the correct dimensions
  const pcbSmtpads = circuitJson2.filter((e) => e.type === "pcb_smtpad")
  expect(pcbSmtpads.length).toBe(1)

  expect(
    pcbSmtpads.some(
      (p) => p.shape === "rect" && p.width === 1.8 && p.height === 0.6,
    ),
  ).toBe(true)
})
