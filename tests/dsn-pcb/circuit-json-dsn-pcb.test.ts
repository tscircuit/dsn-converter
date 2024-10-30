import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import {
  convertCircuitJsonToDsnJson,
  convertDsnJsonToCircuitJson,
  parseDsnToDsnJson,
} from "lib"
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}
import { expect, test } from "bun:test"

test("circuit json to dsn json", async () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile)
  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)
  const backToDsnJson = convertCircuitJsonToDsnJson(circuitJson)
  const validationCircuitJson = convertDsnJsonToCircuitJson(backToDsnJson)

  expect(convertCircuitJsonToPcbSvg(validationCircuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
