import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { expect, test } from "bun:test"
import { convertDsnPcbToCircuitJson, parseDsnToDsnJson, type DsnPcb } from "lib"

// @ts-ignore
import dsnFile from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("smoothie board: no NaN values in circuit json", () => {
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  for (const el of circuitJson) {
    const json = JSON.stringify(el)
    expect(json).not.toContain("NaN")
  }
})

test("smoothie board: unique smtpad and via IDs", () => {
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const padIds = circuitJson
    .filter((el: any) => el.type === "pcb_smtpad")
    .map((el: any) => el.pcb_smtpad_id)
  expect(new Set(padIds).size).toBe(padIds.length)

  const viaIds = circuitJson
    .filter((el: any) => el.type === "pcb_via")
    .map((el: any) => el.pcb_via_id)
  expect(new Set(viaIds).size).toBe(viaIds.length)
})

test("smoothie board: correct element counts", () => {
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const counts: Record<string, number> = {}
  for (const el of circuitJson) {
    counts[(el as any).type] = (counts[(el as any).type] || 0) + 1
  }

  expect(counts.pcb_board).toBe(1)
  expect(counts.pcb_smtpad).toBe(1055)
  expect(counts.pcb_via).toBe(42)
  expect(counts.source_component).toBe(322)
  expect(counts.source_port).toBe(1055)
  expect(counts.pcb_port).toBe(1055)
  expect(counts.source_net).toBe(245)
})

test("smoothie board: rotated component pads are positioned correctly", () => {
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  // Verify that pads of rotated components have distinct positions
  // (if rotation were not applied, many pads would overlap)
  const padPositions = circuitJson
    .filter((el: any) => el.type === "pcb_smtpad")
    .map((el: any) => `${el.x.toFixed(3)},${el.y.toFixed(3)}`)

  const uniquePositions = new Set(padPositions)
  // With rotation applied, we should have many more unique positions
  // than without (where overlapping pads would reduce the count)
  expect(uniquePositions.size).toBeGreaterThan(900)
})
