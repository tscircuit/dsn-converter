import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import dsnFile from "../assets/repro/Issue145-smoothieboard.dsn" with {
  type: "text",
}

test("issue54: full Smoothie Board DSN converts without errors", () => {
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  expect(dsnJson).toBeDefined()
  const totalPlaces = dsnJson.placement.components.reduce(
    (sum, c) => sum + c.places.length,
    0,
  )
  expect(totalPlaces).toBeGreaterThan(100)

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  expect(circuitJson).toBeDefined()

  // Should have source components
  const sourceComponents = circuitJson.filter(
    (e: any) => e.type === "source_component",
  )
  expect(sourceComponents.length).toBeGreaterThan(50)

  // Should have pcb pads
  const pcbPads = circuitJson.filter(
    (e: any) => e.type === "pcb_smtpad" || e.type === "pcb_plated_hole",
  )
  expect(pcbPads.length).toBeGreaterThan(100)

  // No NaN values in any numeric fields
  const json = JSON.stringify(circuitJson)
  expect(json).not.toContain('"NaN"')
  expect(json).not.toContain(":NaN")

  // SVG should render without throwing
  const svg = convertCircuitJsonToPcbSvg(circuitJson)
  expect(svg).toContain("<svg")
  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
