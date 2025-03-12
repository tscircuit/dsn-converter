import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"

import circuitJson from "../assets/repro/smtpad-with-custom-dimenstion.json"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"

test("check smtpad dimension", async () => {
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson2 = convertDsnJsonToCircuitJson(dsnJson)

  // check if the smtpad has the correct dimensions
  const pcbSmtpads = circuitJson2.filter((e) => e.type === "pcb_smtpad")
  expect(pcbSmtpads.length).toBe(2)

  // expect the pads to have the correct dimensions and not the same
  expect(
    pcbSmtpads.some(
      (p) =>
        p.shape === "rect" &&
        Math.round(p.width * 1000) / 1000 === 0.308 &&
        Math.round(p.height * 1000) / 1000 === 1.324,
    ),
  ).toBe(true)

  expect(convertCircuitJsonToPcbSvg(circuitJson2)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
