import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import {
  convertCircuitJsonToDsnJson,
  convertDsnJsonToCircuitJson,
  parseDsnToDsnJson,
  convertCircuitJsonToDsnString,
} from "lib"
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}
import { expect, test } from "bun:test"

import circuitJson from "../../circuitJson.json"

test.skip("circuit json to dsn json", async () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile)
  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)

  const convertedBackToDsnJson = convertCircuitJsonToDsnJson(circuitJson)
  const convertedBackToCircuitJson = convertDsnJsonToCircuitJson(
    convertedBackToDsnJson,
  )

  expect(
    convertCircuitJsonToPcbSvg(convertedBackToCircuitJson),
  ).toMatchSvgSnapshot(import.meta.path)
})
