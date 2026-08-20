import { expect, test } from "bun:test"
import { convertDsnSessionToCircuitJson, parseDsnToDsnJson } from "lib"

import type { DsnPcb, DsnSession } from "lib/dsn-pcb/types"

// @ts-ignore
import input_dsn_local from "../assets/repro/repro13/input_dsn_local.dsn" with {
  type: "text",
}

import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
// @ts-ignore
import output_session from "../assets/repro/repro13/output_local.ses" with {
  type: "text",
}

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
