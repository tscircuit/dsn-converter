import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import {
  convertCircuitJsonToDsnJson,
  convertCircuitJsonToDsnString,
  parseDsnToDsnJson,
} from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"

import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"
import circuitJson from "../assets/repro/pill-shaped-plated-hole.json"

test("check pill shape plated hole dimension", async () => {
  const directDsnJson = convertCircuitJsonToDsnJson(
    circuitJson as AnyCircuitElement[],
  ) as DsnPcb
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  expect(dsnJson.library.images[0].pins[0].padstack_name).toBe(
    "Oval[A]Pad_1199.9976x1799.9964_um",
  )
  expect(
    directDsnJson.library.padstacks.some(
      (padstack) =>
        padstack.name === "Oval[A]Pad_1199.9976x1799.9964_um" &&
        padstack.hole?.width === 800 &&
        padstack.hole?.height === 1400,
    ),
  ).toBe(true)

  const circuitJson2 = convertDsnJsonToCircuitJson(dsnJson)

  // TODO: udpate the test to convert this to plated_hole
  // check if the smtpad has the correct dimensions
  const pcbSmtpads = circuitJson2.filter((e) => e.type === "pcb_smtpad")
  expect(pcbSmtpads.length).toBe(1)

  expect(
    pcbSmtpads.some(
      (p) => p.shape === "rect" && p.width === 1.2 && p.height === 0.6,
    ),
  ).toBe(true)
})
