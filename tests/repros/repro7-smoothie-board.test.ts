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

  const microUsbImage = dsnJson.library.images.find(
    (image) => image.name === "smoothieboard-5driver:USB-B-PTH",
  )
  expect(microUsbImage?.pins.map((pin) => pin.pin_number)).toContain("D-")
  expect(microUsbImage?.pins.map((pin) => pin.pin_number)).toContain("GND")
  expect(microUsbImage?.pins.find((pin) => pin.pin_number === "D-")?.x).toBe(
    1981.2,
  )

  const polarizedCapImage = dsnJson.library.images.find(
    (image) => image.name === "smoothieboard-5driver:PANASONIC_D",
  )
  expect(polarizedCapImage?.pins.map((pin) => pin.pin_number)).toEqual([
    "-",
    "+",
  ])

  const hasInvalidNumber = (value: unknown): boolean => {
    if (typeof value === "number") return Number.isNaN(value)
    if (Array.isArray(value)) return value.some(hasInvalidNumber)
    if (value && typeof value === "object") {
      return Object.values(value).some(hasInvalidNumber)
    }
    return false
  }
  expect(hasInvalidNumber(circuitJson)).toBe(false)
  expect(JSON.stringify(circuitJson)).not.toContain("NaN")

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
