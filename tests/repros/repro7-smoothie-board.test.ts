import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { expect, test } from "bun:test"
import { convertDsnPcbToCircuitJson, parseDsnToDsnJson, type DsnPcb } from "lib"

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

test("smoothieboard source_port pin_number has no NaN", () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const sourcePorts = circuitJson.filter(
    (e) => e.type === "source_port",
  ) as Array<{ pin_number?: number }>

  expect(sourcePorts.length).toBeGreaterThan(0)

  for (const sourcePort of sourcePorts) {
    if (typeof sourcePort.pin_number === "number") {
      expect(Number.isNaN(sourcePort.pin_number)).toBe(false)
    }
  }
})
