import fs from "fs"
import { parseDsnToDsnJson, convertDsnPcbToCircuitJson } from "./lib"

const dsnContent = fs.readFileSync("./tests/assets/repro/smoothieboard-repro.dsn", "utf-8")
const dsnJson = parseDsnToDsnJson(dsnContent)
const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

console.log(`Total elements: ${circuitJson.length}`)
const types = {}
circuitJson.forEach(e => {
  types[e.type] = (types[e.type] || 0) + 1
})
console.log("Element types:", JSON.stringify(types, null, 2))
