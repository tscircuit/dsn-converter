import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import dsnFileWithFreeroutingTrace from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

const getId = (element: Record<string, unknown>) =>
  Object.entries(element).find(([key]) => key.endsWith("_id"))?.[1]

const getUnmatchedNetPins = (dsnJson: DsnPcb, circuitJson: any[]) => {
  const sourcePortNames = new Set(
    circuitJson
      .filter((element) => element.type === "source_port")
      .map((element) => element.name),
  )
  return dsnJson.network.nets
    .filter((net) => !net.name?.startsWith("unconnected-"))
    .flatMap((net) => net.pins ?? [])
    .filter((pin) => !sourcePortNames.has(pin))
}

const findNonFiniteNumbers = (
  value: unknown,
  path = "root",
  result: string[] = [],
) => {
  if (typeof value === "number" && !Number.isFinite(value)) {
    result.push(path)
    return result
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findNonFiniteNumbers(item, `${path}[${index}]`, result),
    )
    return result
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) =>
      findNonFiniteNumbers(item, `${path}.${key}`, result),
    )
  }
  return result
}

test("smoothieboard rotated pins parse as real pin labels", () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb
  const pins = dsnJson.library.images.flatMap((image) => image.pins)
  const panasonicEPins = dsnJson.library.images.find((image) =>
    image.name.endsWith("PANASONIC_E"),
  )!.pins
  const sot89Pins = dsnJson.library.images.find((image) =>
    image.name.endsWith("SOT89"),
  )!.pins

  expect(pins.some((pin) => pin.pin_number === "rotate")).toBe(false)
  expect(panasonicEPins.map((pin) => pin.pin_number)).toEqual(["+", "-"])
  expect(sot89Pins.some((pin) => pin.pin_number === "2@1")).toBe(true)
  expect(
    pins.filter((pin) => pin.rotation !== undefined).length,
  ).toBeGreaterThan(0)
})

test("smoothieboard converts without malformed Circuit JSON", () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const counts = circuitJson.reduce<Record<string, number>>((acc, element) => {
    acc[element.type] = (acc[element.type] ?? 0) + 1
    return acc
  }, {})
  const ids = circuitJson
    .map((element) => getId(element as Record<string, unknown>))
    .filter(Boolean)

  expect(findNonFiniteNumbers(circuitJson)).toEqual([])
  expect(JSON.stringify(circuitJson)).not.toContain("NaN")
  expect(new Set(ids).size).toBe(ids.length)
  expect(getUnmatchedNetPins(dsnJson, circuitJson)).toEqual([])
  expect(counts.pcb_board).toBe(1)
  expect(counts.pcb_smtpad).toBe(1055)
  expect(counts.pcb_via).toBe(42)
  expect(counts.source_component).toBe(322)
  expect(counts.source_port).toBe(1055)
  expect(counts.pcb_port).toBe(1055)
  expect(counts.source_net).toBe(245)
})
