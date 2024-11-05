import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
// @ts-ignore
import { expect, test } from "bun:test"
import { parseDsnToDsnJson } from "lib"

// @ts-ignore
import convertedDsnFile from "../assets/testkicadproject/freeroutingTraceAdded.dsn" with {
  type: "text",
}

test("parse dsn to circuit json", async () => {
  const fs = require("fs")
  const dsnJson = parseDsnToDsnJson(convertedDsnFile)

  fs.writeFileSync("dsnJson.json", JSON.stringify(dsnJson, null, 2))

  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)

  fs.writeFileSync(
    "circuitJsonConverted.json",
    JSON.stringify(circuitJson, null, 2),
  )

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
