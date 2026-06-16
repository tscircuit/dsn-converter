import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import dsnFileWithFreeroutingTrace from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("smoothieboard repro", async () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})

test("smoothieboard net names with digits are parsed correctly", () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb

  // Net "3.3V" should be parsed as a single token, not split into "3.3" and "V"
  const net33v = dsnJson.network.nets.find((n) => n.name === "3.3V")
  expect(net33v).toBeDefined()
  expect(net33v!.pins.length).toBeGreaterThan(0)

  // "3.3V" should appear in class net_names
  const cls = dsnJson.network.classes[0]
  expect(cls.net_names).toContain("3.3V")
  expect(cls.net_names).toContain("5V")
  expect(cls.net_names).toContain("AGND")
})
