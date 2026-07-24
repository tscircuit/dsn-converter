import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import type { PcbSmtPad } from "circuit-json"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

const smoothieboardDsn = readFileSync(
  "tests/assets/repro/smoothieboard-repro.dsn",
  "utf8",
)

test("places Smoothie Board back-side SMT pads on the bottom layer", () => {
  const dsnPcb = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnPcb)

  const backSideComponentIds = new Set(
    dsnPcb.placement.components.flatMap((component) =>
      component.places
        .filter((place) => place.side === "back")
        .map((place) => `${component.name}_${place.refdes}`),
    ),
  )

  const backSidePads = circuitJson.filter(
    (element): element is PcbSmtPad =>
      element.type === "pcb_smtpad" &&
      element.pcb_component_id !== undefined &&
      backSideComponentIds.has(element.pcb_component_id),
  )

  expect(backSidePads.length).toBeGreaterThan(0)
  expect(backSidePads.every((pad) => pad.layer === "bottom")).toBe(true)
})
