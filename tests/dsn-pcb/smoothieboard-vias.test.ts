import { expect, test } from "bun:test"
import type { PcbVia } from "circuit-json"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

test("smoothieboard protected vias keep unique ids and DSN padstack size", async () => {
  const smoothieboardDsn = await Bun.file(
    new URL("../assets/repro/smoothieboard-repro.dsn", import.meta.url),
  ).text()
  const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
  const viaWires = dsnJson.wiring.wires.filter((wire) => wire.type === "via")

  expect(viaWires.length).toBeGreaterThan(1)
  expect(
    viaWires.every((wire) => wire.via_name === "Via[0-3]_800:400_um"),
  ).toBe(true)

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const vias = circuitJson.filter(
    (element): element is PcbVia => element.type === "pcb_via",
  )
  const viaIds = vias.map((via) => via.pcb_via_id)

  expect(vias.length).toBe(viaWires.length)
  expect(new Set(viaIds).size).toBe(viaIds.length)
  expect(vias.every((via) => via.pcb_trace_id === "pcb_trace_AGND")).toBe(true)
  expect(vias.every((via) => via.outer_diameter === 0.8)).toBe(true)
  expect(vias.every((via) => via.hole_diameter === 0.4)).toBe(true)
})
