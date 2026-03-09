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

test("smoothieboard source_port pin_number has no NaN or null", () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const sourcePorts = circuitJson.filter(
    (e) => e.type === "source_port",
  ) as Array<{
    pin_number?: number
    pin_label?: string
  }>

  expect(sourcePorts.length).toBeGreaterThan(0)

  let nonNumericPinCount = 0
  for (const sourcePort of sourcePorts) {
    expect(sourcePort.pin_number).not.toBeNull()
    if (typeof sourcePort.pin_number === "number") {
      expect(Number.isNaN(sourcePort.pin_number)).toBe(false)
    } else {
      nonNumericPinCount += 1
      expect(typeof sourcePort.pin_label).toBe("string")
      expect(sourcePort.pin_label?.length).toBeGreaterThan(0)
    }
  }
  expect(nonNumericPinCount).toBeGreaterThan(0)
})
