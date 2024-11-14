import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"

import circuitJson from "../assets/testkicadproject/circuitJson.json"
import type { AnyCircuitElement } from "circuit-json"

test("circuit json to dsn file", async () => {
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  const dsnJson = parseDsnToDsnJson(dsnFile)
  const circuitJson2 = convertDsnJsonToCircuitJson(dsnJson)

  expect(convertCircuitJsonToPcbSvg(circuitJson2)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
