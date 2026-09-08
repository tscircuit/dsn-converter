import { expect, test } from "bun:test"
import { convertDsnPcbToCircuitJson, parseDsnToDsnJson, type DsnPcb } from "lib"
// @ts-ignore
import dsn from "../assets/repro/smoothieboard-repro.dsn" with { type: "text" }

test("string pin numbers do not produce NaN source_port.pin_number", () => {
  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  const cj = convertDsnPcbToCircuitJson(dsnJson) as any[]

  const ports = cj.filter((e) => e.type === "source_port")
  const nanPorts = ports.filter(
    (p) => p.pin_number !== undefined && Number.isNaN(p.pin_number),
  )

  // The smoothieboard has 78 non-numeric pin names (EPAD, GND, A, C, P$1…).
  // They must simply omit pin_number rather than carry NaN.
  expect(nanPorts.length).toBe(0)

  // And string-named pins must still be reachable via port_hints/name
  const epad = ports.find((p) => p.name.includes("EPAD"))
  expect(epad).toBeDefined()
})
