import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToCircuitJson } from "lib"
// @ts-ignore
import circuit from "../assets/repro/dsn_rotation_test.json" with {
  type: "json",
}
import type { AnyCircuitElement } from "circuit-json"

test("Rotation  repro", async () => {
  const dsn = convertCircuitJsonToDsnString(circuit as AnyCircuitElement[])
  const circuitJson = parseDsnToCircuitJson(dsn)
  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
