import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"

import circuitJson from "../assets/repro/chip-with-smtpads.json"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"

test("check chip smtpad dimension", async () => {
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson2 = convertDsnJsonToCircuitJson(dsnJson)

  // check if the smtpad has the correct dimensions
  const pcbSmtpads = circuitJson2.filter((e) => e.type === "pcb_smtpad")
  expect(pcbSmtpads.length).toBe(8)

  // expect the pads to have the correct dimensions and not the same
  expect(
    pcbSmtpads.some(
      (p) => p.shape === "rect" && p.width === 1 && p.height === 0.6,
    ),
  ).toBe(true)

  expect(convertCircuitJsonToPcbSvg(circuitJson2)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
