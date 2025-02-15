import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { expect, test } from "bun:test"
import { convertDsnPcbToCircuitJson, parseDsnToDsnJson, type DsnPcb } from "lib"

// @ts-ignore
import dsnFileWithFreeroutingTrace from "../assets/repro/slice-of-smoothieboard-repro.dsn" with {
  type: "text",
}
test("smoothieboard rotation repro", async () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
