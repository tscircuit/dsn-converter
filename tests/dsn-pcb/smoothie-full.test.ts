import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
import { expect, test } from "bun:test"
import { parseDsnToDsnJson, type DsnPcb } from "lib"
import * as fs from "fs"

test("convert full smoothieboard DSN - detailed analysis", async () => {
  // Use the existing repro file
  const dsnContent = fs.readFileSync("tests/assets/repro/smoothieboard-repro.dsn", "utf-8")
  
  const dsnJson = parseDsnToDsnJson(dsnContent) as DsnPcb
  
  console.log("\n=== DSN Structure Analysis ===")
  console.log("Resolution:", dsnJson.resolution)
  console.log("Unit:", dsnJson.unit)
  console.log("Layers:", dsnJson.structure.layers?.length || 0)
  console.log("Boundary type:", Object.keys(dsnJson.structure.boundary))
  console.log("Images (footprints):", dsnJson.library.images.length)
  console.log("Padstacks:", dsnJson.library.padstacks.length)
  console.log("Placement components:", dsnJson.placement.components.length)
  console.log("Network nets:", dsnJson.network.nets.length)
  console.log("Wiring wires:", dsnJson.wiring?.wires?.length || 0)
  
  // Count total places
  let totalPlaces = 0
  for (const comp of dsnJson.placement.components) {
    totalPlaces += comp.places.length
  }
  console.log("Total component placements:", totalPlaces)
  
  // Convert to circuit JSON
  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)
  
  console.log("\n=== Circuit JSON Analysis ===")
  const types = new Map<string, number>()
  for (const el of circuitJson) {
    types.set(el.type, (types.get(el.type) || 0) + 1)
  }
  for (const [type, count] of types) {
    console.log(`  ${type}: ${count}`)
  }
  
  // Check for any elements with NaN or undefined values
  let hasIssues = false
  for (const el of circuitJson) {
    const json = JSON.stringify(el)
    if (json.includes("NaN") || json.includes("undefined")) {
      console.log("Element with issues:", el.type, el)
      hasIssues = true
    }
  }
  if (!hasIssues) {
    console.log("\nNo NaN or undefined values found")
  }
  
  expect(circuitJson.length).toBeGreaterThan(3000)
})
