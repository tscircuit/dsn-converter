import { expect, test } from "bun:test"
import {
  convertCircuitJsonToDsnString,
  parseDsnToDsnJson,
  convertDsnSessionToCircuitJson,
} from "lib"

import circuitJson from "../../input_circuit.json"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb, DsnSession } from "lib/dsn-pcb/types"

import input_dsn_local from "../assets/repro/repro13/input_dsn_local.dsn" with { type: "text" }

import output_session from "../assets/repro/repro13/output_local.ses" with { type: "text" }
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

// test("missing traces in waterCounter", async () => {
//   const dsnString = convertCircuitJsonToDsnString(
//     circuitJson as AnyCircuitElement[],
//   )

//   Bun.write("input_dsn_local.dsn", dsnString)
// })

test("convert session to circuit json", async () => {
  const pcbJson = parseDsnToDsnJson(input_dsn_local) as DsnPcb
  const sessionJson = parseDsnToDsnJson(output_session) as DsnSession
  const circuitJsonFromSession = convertDsnSessionToCircuitJson(
    pcbJson,
    sessionJson,
  )

  expect(convertCircuitJsonToPcbSvg(circuitJsonFromSession)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
