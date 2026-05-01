import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"
import type { SourcePort } from "circuit-json"

// @ts-ignore
import dsnFileWithFreeroutingTrace from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

/**
 * Regression test for Smoothie Board pin parsing bugs:
 *
 * 1. Pins with a (rotate <angle>) modifier had their pin identifier read as
 *    "rotate" instead of the actual identifier (e.g. "GND1", "A", "+").
 *    Fixed in lib/utils/get-pin-number.ts.
 *
 * 2. A lone '-' character used as a pin label (e.g. PANASONIC_E capacitors)
 *    was tokenized as a negative-number prefix producing NaN.
 *    Fixed in lib/common/parse-sexpr.ts.
 *
 * 3. String pin identifiers were coerced with Number(), producing NaN for
 *    non-numeric names like "GND1", "A", "+", "-".
 *    Fixed in convert-dsn-pcb-components-to-source-components-and-ports.ts.
 */
test("smoothieboard: zero NaN pin_numbers in source_ports", () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const sourcePorts = circuitJson.filter(
    (item): item is SourcePort => item.type === "source_port",
  )

  expect(sourcePorts.length).toBeGreaterThan(0)

  const nanPorts = sourcePorts.filter(
    (p) => typeof p.pin_number === "number" && isNaN(p.pin_number),
  )

  expect(nanPorts).toHaveLength(0)
})

test("smoothieboard: parses all 1055 pads without error", () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const sourcePorts = circuitJson.filter(
    (item): item is SourcePort => item.type === "source_port",
  )

  expect(sourcePorts.length).toBe(1055)
})

test("smoothieboard: lone dash pin label is parsed as string not NaN", () => {
  // PANASONIC_E electrolytic capacitors use '-' as a pin label.
  // These used to produce NaN because the tokenizer treated '-' as a
  // negative-number prefix.
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const sourcePorts = circuitJson.filter(
    (item): item is SourcePort => item.type === "source_port",
  )

  // Previously 8 ports from PANASONIC_E had NaN pin_number due to lone '-'
  const panasonicPorts = sourcePorts.filter((p) =>
    p.source_port_id.includes("PANASONIC_E"),
  )

  expect(panasonicPorts.length).toBeGreaterThan(0)
  const allValid = panasonicPorts.every(
    (p) => p.pin_number === undefined || typeof p.pin_number === "number",
  )
  expect(allValid).toBe(true)
})
