import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import dsnFileWithFreeroutingTrace from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("smoothieboard repro", async () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb

  const eia3216 = dsnJson.library.images.find(
    (image) => image.name === "smoothieboard-5driver:EIA3216",
  )
  const qfn24 = dsnJson.library.images.find(
    (image) => image.name === "smoothieboard-5driver:QFN24_4MM",
  )
  const panasonicE = dsnJson.library.images.find(
    (image) => image.name === "smoothieboard-5driver:PANASONIC_E",
  )
  const panasonicD = dsnJson.library.images.find(
    (image) => image.name === "smoothieboard-5driver:PANASONIC_D",
  )

  expect(eia3216).toBeDefined()
  expect(qfn24).toBeDefined()
  expect(panasonicE).toBeDefined()
  expect(panasonicD).toBeDefined()

  expect(eia3216?.pins).toContainEqual(
    expect.objectContaining({
      pin_number: "A",
      x: 1400,
      y: 0,
    }),
  )

  expect(eia3216?.pins).toContainEqual(
    expect.objectContaining({
      pin_number: "C",
      x: -1400,
      y: 0,
    }),
  )

  expect(qfn24?.pins).toContainEqual(
    expect.objectContaining({
      pin_number: 24,
      x: -1250,
      y: 2000,
    }),
  )

  expect(panasonicE?.pins).toContainEqual(
    expect.objectContaining({
      pin_number: "+",
      x: 3000,
      y: 0,
    }),
  )

  expect(panasonicE?.pins).toContainEqual(
    expect.objectContaining({
      pin_number: "-",
      x: -3000,
      y: 0,
    }),
  )

  expect(panasonicD?.pins).toContainEqual(
    expect.objectContaining({
      pin_number: "-",
      x: -2400,
      y: 0,
    }),
  )

  expect(panasonicD?.pins).toContainEqual(
    expect.objectContaining({
      pin_number: "+",
      x: 2400,
      y: 0,
    }),
  )

  expect(
    dsnJson.library.images.flatMap((image) =>
      image.pins.filter((pin) => pin.pin_number === "rotate"),
    ),
  ).toEqual([])

  expect(
    dsnJson.library.images.flatMap((image) =>
      image.pins.filter(
        (pin) =>
          typeof pin.pin_number === "number" &&
          !Number.isFinite(pin.pin_number),
      ),
    ),
  ).toEqual([])

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const nonFiniteNumberPaths: string[] = []
  const malformedIdPaths: string[] = []

  const inspect = (value: unknown, path: string): void => {
    if (typeof value === "number" && !Number.isFinite(value)) {
      nonFiniteNumberPaths.push(path)
      return
    }

    if (Array.isArray(value)) {
      value.forEach((entry, index) => inspect(entry, `${path}[${index}]`))
      return
    }

    if (!value || typeof value !== "object") return

    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`

      if (
        key.endsWith("_id") &&
        typeof child === "string" &&
        /NaN|undefined|null/.test(child)
      ) {
        malformedIdPaths.push(childPath)
      }

      inspect(child, childPath)
    }
  }

  inspect(circuitJson, "circuitJson")

  expect(nonFiniteNumberPaths).toEqual([])
  expect(malformedIdPaths).toEqual([])

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
