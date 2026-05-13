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
  const rotatedPinsParsedAsPinNumbers = dsnJson.library.images.flatMap(
    (image) => image.pins.filter((pin) => pin.pin_number === "rotate"),
  )

  expect(rotatedPinsParsedAsPinNumbers).toHaveLength(0)

  const tactileSwitchImage = dsnJson.library.images.find(
    (image) => image.name === "smoothieboard-5driver:TACTILE_SWITCH_SMD",
  )

  expect(tactileSwitchImage?.pins).toContainEqual(
    expect.objectContaining({
      pin_number: 4,
      x: 2540,
      y: -1905,
    }),
  )

  expect(
    circuitJson.filter((element: any) =>
      Object.values(element).some((value) =>
        String(value).includes("Padrotate"),
      ),
    ),
  ).toHaveLength(0)

  expect(
    circuitJson.filter((element: any) =>
      Object.values(element).some(
        (value) => typeof value === "number" && !Number.isFinite(value),
      ),
    ),
  ).toHaveLength(0)

  expect(
    circuitJson.filter((element: any) =>
      Object.values(element).some((value) => String(value).includes("NaN")),
    ),
  ).toHaveLength(0)

  const stringPinSourcePort = circuitJson.find(
    (element: any) =>
      element.type === "source_port" && element.name === "Q2-GND2",
  ) as any

  expect(stringPinSourcePort).toEqual(
    expect.objectContaining({
      port_hints: ["GND2"],
    }),
  )
  expect("pin_number" in stringPinSourcePort).toBe(false)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
