import { expect, test } from "bun:test"
import { su } from "@tscircuit/soup-util"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import dsnFileWithFreeroutingTrace from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("smoothieboard repro", async () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})

test("smoothieboard conversion emits pcb components and stable nonnumeric pin ids", () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const soup = su(circuitJson as any)

  const expectedPlacementCount = dsnJson.placement.components.reduce(
    (sum, component) => sum + component.places.length,
    0,
  )
  const pcbComponentIds = new Set(
    soup.pcb_component.list().map((component) => component.pcb_component_id),
  )

  expect(soup.pcb_component.list()).toHaveLength(expectedPlacementCount)
  expect(
    soup.source_port.list().filter((port) => Number.isNaN(port.pin_number)),
  ).toHaveLength(0)
  expect(
    soup.pcb_smtpad.list().filter((pad) => pad.pcb_smtpad_id.includes("NaN")),
  ).toHaveLength(0)

  for (const pad of soup.pcb_smtpad.list()) {
    if (!pad.pcb_component_id) throw new Error("Expected pad pcb_component_id")
    expect(pcbComponentIds.has(pad.pcb_component_id)).toBe(true)
  }
  for (const port of soup.pcb_port.list()) {
    if (!port.pcb_component_id)
      throw new Error("Expected port pcb_component_id")
    expect(pcbComponentIds.has(port.pcb_component_id)).toBe(true)
  }
})
