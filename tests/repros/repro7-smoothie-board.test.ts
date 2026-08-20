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

test("smoothieboard rotated string pins keep their pin identifiers", () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb
  const eia3216Image = dsnJson.library.images.find(
    (image) => image.name === "smoothieboard-5driver:EIA3216",
  )

  expect(eia3216Image?.pins.map((pin) => pin.pin_number)).toContain("A")
  expect(eia3216Image?.pins.map((pin) => pin.pin_number)).toContain("C")

  const panasonicEImage = dsnJson.library.images.find(
    (image) => image.name === "smoothieboard-5driver:PANASONIC_E",
  )

  expect(panasonicEImage?.pins.map((pin) => pin.pin_number)).toContain("+")
  expect(panasonicEImage?.pins.map((pin) => pin.pin_number)).toContain("-")

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const serializedElements = circuitJson.map((element) =>
    JSON.stringify(element),
  )

  expect(serializedElements.some((element) => element.includes("NaN"))).toBe(
    false,
  )
  expect(
    serializedElements.some((element) =>
      element.includes("pcb_smtpad_smoothieboard-5driver:EIA3216_C7_A"),
    ),
  ).toBe(true)
  expect(
    serializedElements.some((element) =>
      element.includes("pcb_smtpad_smoothieboard-5driver:EIA3216_C7_C"),
    ),
  ).toBe(true)
  expect(
    serializedElements.some((element) =>
      element.includes("pcb_smtpad_smoothieboard-5driver:PANASONIC_E_C60_plus"),
    ),
  ).toBe(true)
  expect(
    serializedElements.some((element) =>
      element.includes(
        "pcb_smtpad_smoothieboard-5driver:PANASONIC_E_C60_minus",
      ),
    ),
  ).toBe(true)
})
