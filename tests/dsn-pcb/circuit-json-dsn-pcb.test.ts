import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import {
  circuitJsonToDsnJson,
  dsnJsonToCircuitJson,
  parseDsnToDsnJson,
} from "lib"
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}
import { expect, test } from "bun:test"

test("circuit json to dsn json", async () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile)
  const circuitJson = dsnJsonToCircuitJson(dsnJson)
  const backToDsnJson = circuitJsonToDsnJson(circuitJson)
  const validationCircuitJson = dsnJsonToCircuitJson(backToDsnJson)

  expect(convertCircuitJsonToPcbSvg(validationCircuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
