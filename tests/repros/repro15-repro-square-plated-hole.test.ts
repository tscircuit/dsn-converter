import { expect, test } from "bun:test"
import { parseDsnToDsnJson, convertDsnSessionToCircuitJson } from "lib"

import type { DsnPcb, DsnSession } from "lib/dsn-pcb/types"

// @ts-ignore
import input_dsn_local from "../assets/repro/repro15/input.dsn" with {
  type: "text",
}

// @ts-ignore
import output_session from "../assets/repro/repro15/output.ses" with {
  type: "text",
}
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

test("repro 15: convert session to circuit json", async () => {
  const pcbJson = parseDsnToDsnJson(input_dsn_local) as DsnPcb
  const sessionJson = parseDsnToDsnJson(output_session) as DsnSession
  const circuitJsonFromSession = convertDsnSessionToCircuitJson(
    pcbJson,
    sessionJson,
  )

  expect(
    convertCircuitJsonToPcbSvg(circuitJsonFromSession, {}),
  ).toMatchSvgSnapshot(import.meta.path)
})
