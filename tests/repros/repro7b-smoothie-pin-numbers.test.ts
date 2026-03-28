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
    (p) => typeof p.pin_number === "number" && isNaN(p.pin_number),
  )

  if (nanPorts.length > 0) {
    console.log(
      "NaN port samples:",
      nanPorts.slice(0, 3).map((p) => p.name),
    )
  }

  expect(nanPorts.length).toBe(0)
})

test("smoothieboard: named pins (e.g. GND1, GND2) are preserved in port_hints", () => {
  const circuitJson = parseDsnToCircuitJson(smoothieDsn)
  const sourcePorts = circuitJson.filter(
    (item): item is SourcePort => item.type === "source_port",
  )

  // CRYSTAL_3.2X2.5 has named pins GND1 and GND2
  const crystalPorts = sourcePorts.filter((p) =>
    p.source_component_id?.includes("CRYSTAL_3.2X2.5"),
  )
  expect(crystalPorts.length).toBeGreaterThan(0)

  // Named pins should have undefined pin_number but port_hints containing the label
  const namedPins = crystalPorts.filter(
    (p) =>
      p.pin_number === undefined && p.port_hints && p.port_hints.length > 0,
  )
  expect(namedPins.length).toBeGreaterThan(0)

  const allHints = namedPins.flatMap((p) => p.port_hints ?? [])
  expect(allHints).toContain("GND1")
  expect(allHints).toContain("GND2")
})

test("smoothieboard: PANASONIC_E capacitor uses + and - pin labels in port_hints", () => {
  const circuitJson = parseDsnToCircuitJson(smoothieDsn)
  const sourcePorts = circuitJson.filter(
    (item): item is SourcePort => item.type === "source_port",
  )

  const panasonicPorts = sourcePorts.filter((p) =>
    p.source_component_id?.includes("PANASONIC_E"),
  )
  expect(panasonicPorts.length).toBeGreaterThan(0)

  // All PANASONIC_E ports must have no NaN pin_number
  const nanPorts = panasonicPorts.filter(
    (p) => typeof p.pin_number === "number" && isNaN(p.pin_number),
  )
  expect(nanPorts.length).toBe(0)

  // + and - are named pins, stored in port_hints
  const allHints = panasonicPorts.flatMap((p) => p.port_hints ?? [])
  expect(allHints).toContain("+")
  expect(allHints).toContain("-")
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

  // All EIA3216 ports must have no NaN pin_number
  const nanPorts = eiaPorts.filter(
    (p) => typeof p.pin_number === "number" && isNaN(p.pin_number),
  )
  expect(nanPorts.length).toBe(0)
})
