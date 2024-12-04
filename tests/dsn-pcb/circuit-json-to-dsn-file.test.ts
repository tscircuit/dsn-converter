import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"

import circuitJson from "../assets/testkicadproject/circuitJson.json"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"

test("circuit json to dsn file", async () => {
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb

  // expect the images pin to be in increasing order of position
  expect(dsnJson.library.images[0].pins[0].x).toBe(-500)
  expect(dsnJson.library.images[0].pins[0].y).toBe(0)

  expect(dsnJson.library.images[0].pins[1].x).toBe(500)
  expect(dsnJson.library.images[0].pins[1].y).toBe(0) 

  const circuitJson2 = convertDsnJsonToCircuitJson(dsnJson)

  expect(convertCircuitJsonToPcbSvg(circuitJson2)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
