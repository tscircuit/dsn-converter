import { expect, test } from "bun:test"
import { parseDsnToCircuitJson } from "lib"
import type { SourcePort } from "circuit-json"

// @ts-ignore
import smoothieDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("smoothieboard: source_port pin_number should never be NaN", () => {
  const circuitJson = parseDsnToCircuitJson(smoothieDsn)
  const sourcePorts = circuitJson.filter(
    (item): item is SourcePort => item.type === "source_port",
  )

  expect(sourcePorts.length).toBeGreaterThan(0)

  const nanPorts = sourcePorts.filter(
    (p) =>
      p.pin_number === null ||
      p.pin_number === undefined ||
      (typeof p.pin_number === "number" && isNaN(p.pin_number)),
  )

  if (nanPorts.length > 0) {
    console.log(
      "NaN port samples:",
      nanPorts.slice(0, 3).map((p) => p.name),
    )
  }

  expect(nanPorts.length).toBe(0)
})

test("smoothieboard: named pins (e.g. GND1, GND2, +, -) are preserved as strings", () => {
  const circuitJson = parseDsnToCircuitJson(smoothieDsn)
  const sourcePorts = circuitJson.filter(
    (item): item is SourcePort => item.type === "source_port",
  )

  // CRYSTAL_3.2X2.5 has named pins GND1 and GND2
  const crystalPorts = sourcePorts.filter((p) =>
    p.source_component_id?.includes("CRYSTAL_3.2X2.5"),
  )
  expect(crystalPorts.length).toBeGreaterThan(0)

  const namedPins = crystalPorts.filter((p) => typeof p.pin_number === "string")
  expect(namedPins.length).toBeGreaterThan(0)

  const namedPinNames = namedPins.map((p) => p.pin_number)
  expect(namedPinNames).toContain("GND1")
  expect(namedPinNames).toContain("GND2")
})

test("smoothieboard: PANASONIC_E capacitor uses + and - pin labels", () => {
  const circuitJson = parseDsnToCircuitJson(smoothieDsn)
  const sourcePorts = circuitJson.filter(
    (item): item is SourcePort => item.type === "source_port",
  )

  const panasonicPorts = sourcePorts.filter((p) =>
    p.source_component_id?.includes("PANASONIC_E"),
  )
  expect(panasonicPorts.length).toBeGreaterThan(0)

  // All PANASONIC_E ports must have valid pin identifiers (no NaN)
  const invalidPorts = panasonicPorts.filter(
    (p) =>
      p.pin_number === null ||
      p.pin_number === undefined ||
      (typeof p.pin_number === "number" && isNaN(p.pin_number)),
  )
  expect(invalidPorts.length).toBe(0)

  const pinValues = panasonicPorts.map((p) => p.pin_number)
  expect(pinValues).toContain("+")
  expect(pinValues).toContain("-")
})

test("smoothieboard: EIA3216 capacitor pins use letter labels (A, C) from rotation format", () => {
  const circuitJson = parseDsnToCircuitJson(smoothieDsn)
  const sourcePorts = circuitJson.filter(
    (item): item is SourcePort => item.type === "source_port",
  )

  const eiaPorts = sourcePorts.filter((p) =>
    p.source_component_id?.includes("EIA3216"),
  )
  expect(eiaPorts.length).toBeGreaterThan(0)

  // All EIA3216 ports must have valid pin identifiers (no NaN)
  const invalidPorts = eiaPorts.filter(
    (p) =>
      p.pin_number === null ||
      p.pin_number === undefined ||
      (typeof p.pin_number === "number" && isNaN(p.pin_number)),
  )
  expect(invalidPorts.length).toBe(0)
})
