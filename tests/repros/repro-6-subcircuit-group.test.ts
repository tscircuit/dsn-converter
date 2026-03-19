import { expect, test } from "bun:test"
import {
  convertCircuitJsonToDsnString,
  convertDsnSessionToCircuitJson,
  parseDsnToCircuitJson,
  parseDsnToDsnJson,
} from "lib"

import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { DsnPcb, DsnSession } from "lib"
// @ts-ignore
import inputDsnFile from "../assets/repro/subcircuit_input.dsn" with {
  type: "text",
}
// @ts-ignore
import testSesFile from "../assets/repro/subcircuit_output.ses" with {
  type: "text",
}

test("check the group subcircuit without board boundary", async () => {
  const pcbJson = parseDsnToDsnJson(inputDsnFile) as DsnPcb
  const sessionJson = parseDsnToDsnJson(testSesFile) as DsnSession
  const circuitJsonFromSession = convertDsnSessionToCircuitJson(
    pcbJson,
    sessionJson,
  )

  expect(convertCircuitJsonToPcbSvg(circuitJsonFromSession)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
