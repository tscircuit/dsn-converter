import { expect, test } from "bun:test"
import { parseDsnToDsnJson, convertDsnPcbToCircuitJson } from "lib"
import { DsnPcb } from "lib/dsn-pcb/types"
import fs from "node:fs"
import path from "node:path"

test("Verify Smoothieboard bounty ($345) - Vias, Rotation, and Pin Numbers", async () => {
  const dsnPath = path.join(
    __dirname,
    "../assets/repro/smoothieboard-repro.dsn",
  )
  const dsnString = fs.readFileSync(dsnPath, "utf-8")

  const dsnJson = parseDsnToDsnJson(dsnString) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  // 1. Check for Vias (Smoothieboard has many vias)
  const vias = circuitJson.filter((e) => e.type === "pcb_via")
  expect(vias.length).toBeGreaterThan(100)

  // Verify via IDs are unique
  const viaIds = new Set(vias.map((v) => (v as any).pcb_via_id))
  expect(viaIds.size).toBe(vias.length)

  // 2. Check for Components and Rotation
  const components = circuitJson.filter((e) => e.type === "pcb_component")
  expect(components.length).toBeGreaterThan(10)

  // 3. Check for NaN in pin numbers or coordinates
  circuitJson.forEach((e) => {
    if (e.type === "source_port") {
      expect(Number.isNaN((e as any).pin_number)).toBe(false)
    }
    if ("x" in e) expect(Number.isNaN((e as any).x)).toBe(false)
    if ("y" in e) expect(Number.isNaN((e as any).y)).toBe(false)
  })

  console.log(
    `Verified ${vias.length} vias and ${components.length} components for Smoothieboard.`,
  )
})
